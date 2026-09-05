import { safeStorage } from './storage.js';
import { api } from '../services/api.js';

export const ACCOUNT_CLOSED_NOTICE_KEY = 'cms_account_closed_notice';
export const DEFAULT_ACCOUNT_CLOSED_MESSAGE =
  'Your account was permanently closed due to repeated duplicate phone number policy violations.';

/**
 * Normalizes a phone number by stripping whitespace, hyphens, parentheses, and dots,
 * and converting to lower case.
 * @param {string | null | undefined} num
 * @returns {string}
 */
export const normalizePhone = (num) => (num ? String(num).replace(/[\s\-().]/g, '').toLowerCase() : '');

/**
 * Generates the safeStorage key for tracking duplicate warnings for a user.
 * @param {string | number | undefined} userId
 * @returns {string}
 */
export const getDuplicateWarningKey = (userId) => `cms_dup_warning_${userId || 'default'}`;

/**
 * Retrieves the normalized duplicate warning count for a user.
 * Non-finite, negative, or malformed stored values are normalized to 0
 * to prevent unintentional account termination on first duplicate.
 * Valid numeric strike counts are preserved.
 * @param {string | number | undefined} userId
 * @returns {number}
 */
export const getDuplicateWarningCount = (userId) => {
  const warningKey = getDuplicateWarningKey(userId);
  const raw = Number(safeStorage.getItem(warningKey));
  return Number.isFinite(raw) && raw >= 0 ? raw : 0;
};

/**
 * Scans for duplicate phone numbers across:
 * 1. Current form's phone entries
 * 2. Existing contacts' phone numbers (excluding current contact being edited)
 * 3. User's own profile phone number
 *
 * @param {Array<{ phoneNumber?: string }>} [phones=[]]
 * @param {Array<{ id?: string | number, phones?: Array<{ phoneNumber?: string }> }>} [existingContacts=[]]
 * @param {string | null | undefined} [userPhone]
 * @param {string | number | null | undefined} [currentContactId]
 * @returns {string | null} Duplicate phone number string if found, otherwise null
 */
export const findDuplicatePhone = (
  phones = [],
  existingContacts = [],
  userPhone = null,
  currentContactId = null
) => {
  const phoneList = Array.isArray(phones) ? phones : [];

  // Check 1: Duplicate phone numbers within the current form
  const seenFormPhones = new Map();
  for (const phoneItem of phoneList) {
    const norm = normalizePhone(phoneItem?.phoneNumber);
    if (!norm) continue;
    if (seenFormPhones.has(norm)) {
      return phoneItem.phoneNumber;
    }
    seenFormPhones.set(norm, phoneItem.phoneNumber);
  }

  // Check 2: Duplicate phone numbers against existing contacts
  if (Array.isArray(existingContacts)) {
    for (const ec of existingContacts) {
      if (currentContactId != null && String(ec?.id) === String(currentContactId)) continue;
      if (Array.isArray(ec?.phones)) {
        for (const ep of ec.phones) {
          const normExisting = normalizePhone(ep?.phoneNumber);
          if (!normExisting) continue;
          for (const phoneItem of phoneList) {
            const normNew = normalizePhone(phoneItem?.phoneNumber);
            if (normNew && normNew === normExisting) {
              return phoneItem.phoneNumber;
            }
          }
        }
      }
    }
  }

  // Check 3: Duplicate phone number against user's own profile phone
  if (userPhone) {
    const normUserPhone = normalizePhone(userPhone);
    if (normUserPhone) {
      for (const phoneItem of phoneList) {
        const normNew = normalizePhone(phoneItem?.phoneNumber);
        if (normNew && normNew === normUserPhone) {
          return phoneItem.phoneNumber;
        }
      }
    }
  }

  return null;
};

/**
 * Enforces the two-strike duplicate phone policy based on backend-driven strike state.
 * Enforcement is driven by backend persistence rather than mutable session storage.
 * - Strike 1: Records/caches warning for display, returns warning violation state.
 * - Strike 2: Calls deleteAccountFn cleanup, clears warning key, returns account-closed state.
 *
 * @param {{
 *   userId?: string | number,
 *   duplicateNumber: string,
 *   strike?: number,
 *   isAccountClosed?: boolean,
 *   error?: string,
 *   deleteAccountFn?: () => Promise<any>
 * }} params
 * @returns {Promise<{
 *   isAccountClosed: boolean,
 *   strike: number,
 *   error: string,
 *   toastMessage?: string,
 *   toastType?: string
 * }>}
 */
export const enforceDuplicatePolicy = async ({
  userId,
  duplicateNumber,
  strike,
  isAccountClosed,
  error: serverError,
  deleteAccountFn = api.deleteAccount
} = {}) => {
  const warningKey = getDuplicateWarningKey(userId);

  // Authoritative strike determination: prefer backend strike/isAccountClosed result
  // Fall back to storage count only when backend strike is not provided (e.g. legacy/mock calls).
  const isTerminated = isAccountClosed !== undefined
    ? Boolean(isAccountClosed)
    : strike !== undefined
      ? Number(strike) >= 2
      : getDuplicateWarningCount(userId) >= 1;

  const resolvedStrike = strike != null
    ? Number(strike)
    : (isTerminated ? 2 : 1);

  if (!isTerminated) {
    // Strike 1: First warning
    safeStorage.setItem(warningKey, '1');
    return {
      isAccountClosed: false,
      strike: resolvedStrike,
      error: serverError || `Warning (1/2): Duplicate phone number "${duplicateNumber}" is strictly prohibited.`,
      toastMessage: `⚠️ First Warning: Duplicate phone number detected. Next violation terminates account!`,
      toastType: 'error'
    };
  }

  // Strike 2: Account closure
  const backendConfirmedClosed = Boolean(isAccountClosed);

  if (typeof deleteAccountFn === 'function') {
    if (backendConfirmedClosed) {
      try {
        await deleteAccountFn();
      } catch {
        // Backend already confirmed account was purged during atomic strike enforcement
      }
    } else {
      // Local fallback deletion is required: propagate any deletion failure
      await deleteAccountFn();
    }
  } else if (!backendConfirmedClosed) {
    throw new Error('Account deletion required but deleteAccountFn is not available.');
  }

  safeStorage.removeItem(warningKey);
  return {
    isAccountClosed: true,
    strike: 2,
    error: serverError || `Account Terminated: Repeated duplicate phone number violation ("${duplicateNumber}").`
  };
};

/**
 * Processes errors resulting from user profile phone update requests.
 * @param {any} err - caught error
 * @param {{
 *   onAccountClosed?: (reason?: string) => Promise<void> | void,
 *   onClose?: () => void,
 *   logout?: () => Promise<void>,
 *   showToast?: (msg: string, type: string) => void,
 *   setIsEditingPhone?: (isEditing: boolean) => void
 * }} [options]
 */
export const handleProfilePhoneError = async (err, {
  onAccountClosed,
  onClose,
  logout,
  showToast,
  setIsEditingPhone
} = {}) => {
  if (err?.accountClosed) {
    setIsEditingPhone?.(false);
    if (typeof onAccountClosed === 'function') {
      await onAccountClosed(err?.message);
    } else {
      safeStorage.setItem(
        ACCOUNT_CLOSED_NOTICE_KEY,
        DEFAULT_ACCOUNT_CLOSED_MESSAGE
      );
      onClose?.();
      try {
        await logout?.();
      } catch {
        // ignore
      }
      showToast?.('Account permanently closed due to policy violations.', 'error');
    }
    return;
  }
  showToast?.(err?.message || 'Failed to update phone number', 'error');
};

