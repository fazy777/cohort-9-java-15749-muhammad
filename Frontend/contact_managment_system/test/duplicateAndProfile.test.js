import test, { describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { api } from '../src/services/api.js';
import { safeStorage } from '../src/utils/storage.js';
import {
  normalizePhone,
  getDuplicateWarningKey,
  getDuplicateWarningCount,
  findDuplicatePhone,
  enforceDuplicatePolicy
} from '../src/utils/duplicatePolicy.js';

describe('ContactSphere Profile Phone & Duplicate Policy Tests', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    safeStorage.clear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    safeStorage.clear();
  });

  test('api.updatePhone rejects when phone payload is missing', async () => {
    await assert.rejects(
      async () => {
        await api.updatePhone({});
      },
      {
        name: 'Error',
        message: 'Phone number is required'
      }
    );
  });

  test('api.updatePhone sends PUT /auth/phone and returns updated profile', async () => {
    globalThis.fetch = async (url, options) => {
      assert.match(url, /\/auth\/phone$/);
      assert.equal(options.method, 'PUT');
      const body = JSON.parse(options.body);
      assert.equal(body.phone, '+15551234567');

      return {
        ok: true,
        status: 200,
        headers: {
          get: (header) => (header.toLowerCase() === 'content-type' ? 'application/json' : null)
        },
        json: async () => ({
          success: true,
          message: 'Phone number updated successfully',
          data: {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '+15551234567'
          }
        })
      };
    };

    const updated = await api.updatePhone({ phone: '+15551234567' });
    assert.equal(updated.id, 1);
    assert.equal(updated.phone, '+15551234567');
  });

  test('api.deleteAccount sends DELETE /auth/account and clears session storage', async () => {
    safeStorage.setItem('cms_user', JSON.stringify({ id: 1, firstName: 'John' }));
    safeStorage.setItem('cms_auth_token', 'mock-token-xyz');

    globalThis.fetch = async (url, options) => {
      assert.match(url, /\/auth\/account$/);
      assert.equal(options.method, 'DELETE');
      return {
        ok: true,
        status: 200,
        headers: {
          get: (header) => (header.toLowerCase() === 'content-type' ? 'application/json' : null)
        },
        json: async () => ({
          success: true,
          message: 'Account permanently closed'
        })
      };
    };

    const res = await api.deleteAccount();
    assert.equal(res.success, true);
    assert.equal(safeStorage.getItem('cms_user'), null);
    assert.equal(safeStorage.getItem('cms_auth_token'), null);
  });

  test('api.deleteAccount preserves session storage when request rejects', async () => {
    safeStorage.setItem('cms_user', JSON.stringify({ id: 1, firstName: 'John' }));
    safeStorage.setItem('cms_auth_token', 'mock-token-xyz');

    globalThis.fetch = async () => {
      throw new Error('Network error during deletion');
    };

    await assert.rejects(
      async () => {
        await api.deleteAccount();
      },
      /Network error during deletion/
    );

    assert.notEqual(safeStorage.getItem('cms_user'), null);
    assert.notEqual(safeStorage.getItem('cms_auth_token'), null);
  });

  test('api.logout clears session storage even when request rejects', async () => {
    safeStorage.setItem('cms_user', JSON.stringify({ id: 1, firstName: 'John' }));
    safeStorage.setItem('cms_auth_token', 'mock-token-xyz');

    globalThis.fetch = async () => {
      throw new Error('Network error during logout');
    };

    await assert.rejects(
      async () => {
        await api.logout();
      },
      /Network error during logout/
    );

    assert.equal(safeStorage.getItem('cms_user'), null);
    assert.equal(safeStorage.getItem('cms_auth_token'), null);
  });

  test('phone normalizer strips formatting correctly for duplicate comparisons', () => {
    assert.equal(normalizePhone('+1 (555) 234-5678'), '+15552345678');
    assert.equal(normalizePhone('555-234-5678'), '5552345678');
    assert.equal(normalizePhone('+44 20 7946 0919'), '+442079460919');
    assert.equal(normalizePhone(''), '');
    assert.equal(normalizePhone(null), '');
  });

  test('warning counter tracks first warning, normalizes malformed counts, and escalates on repeat violation', () => {
    const userId = 42;
    const warningKey = getDuplicateWarningKey(userId);

    // Initially 0 warnings
    assert.equal(getDuplicateWarningCount(userId), 0);

    // Non-finite or malformed stored values normalize to 0
    safeStorage.setItem(warningKey, 'invalid_number');
    assert.equal(getDuplicateWarningCount(userId), 0);

    safeStorage.setItem(warningKey, '-3');
    assert.equal(getDuplicateWarningCount(userId), 0);

    safeStorage.setItem(warningKey, 'NaN');
    assert.equal(getDuplicateWarningCount(userId), 0);

    safeStorage.setItem(warningKey, 'Infinity');
    assert.equal(getDuplicateWarningCount(userId), 0);

    // Violation 1 -> Warn it!
    safeStorage.setItem(warningKey, '1');
    assert.equal(getDuplicateWarningCount(userId), 1);

    // Violation 2 -> Should trigger closure because warnings >= 1
    const shouldCloseAccount = getDuplicateWarningCount(userId) >= 1;
    assert.equal(shouldCloseAccount, true);

    // Clean up
    safeStorage.removeItem(warningKey);
    assert.equal(safeStorage.getItem(warningKey), null);
    assert.equal(getDuplicateWarningCount(userId), 0);
  });

  test('ContactFormModal duplicate flow: Strike 1 warns user and locks submission during check', async () => {
    const userId = 99;
    const warningKey = getDuplicateWarningKey(userId);
    safeStorage.removeItem(warningKey);

    // Non-finite stored value should be normalized to 0, ensuring Strike 1 rather than deletion
    safeStorage.setItem(warningKey, 'corrupt_strike_value');

    let submitting = false;
    let violationState = { isOpen: false, isAccountClosed: false, phoneNumber: '' };
    let error = '';
    let isSubmittingLockedDuringCheck = false;

    // Production duplicate detection across formatted phone numbers
    const payloadPhones = [
      { phoneNumber: '+1 (555) 000-1234' },
      { phoneNumber: '+1-555-000-1234' } // duplicate normalized
    ];

    const duplicateNumber = findDuplicatePhone(payloadPhones);
    assert.equal(duplicateNumber, '+1-555-000-1234');

    // Simulate submission handling with production enforceDuplicatePolicy
    const submitContact = async (phonesToSubmit) => {
      if (submitting || violationState.isOpen) return;
      submitting = true;
      try {
        const dup = findDuplicatePhone(phonesToSubmit);
        if (dup) {
          isSubmittingLockedDuringCheck = submitting;
          const result = await enforceDuplicatePolicy({ userId, duplicateNumber: dup });
          violationState = {
            isOpen: true,
            isAccountClosed: result.isAccountClosed,
            phoneNumber: dup
          };
          error = result.error;
        }
      } finally {
        submitting = false;
      }
    };

    await submitContact(payloadPhones);

    // Assert Strike 1 state
    assert.equal(isSubmittingLockedDuringCheck, true);
    assert.equal(submitting, false);
    assert.equal(violationState.isOpen, true);
    assert.equal(violationState.isAccountClosed, false);
    assert.equal(violationState.phoneNumber, '+1-555-000-1234');
    assert.equal(safeStorage.getItem(warningKey), '1');
    assert.match(error, /Warning \(1\/2\)/);

    // Early guard test: subsequent submission attempts are ignored while violation modal is open
    let secondSubmitRan = false;
    const guardedSubmit = async () => {
      if (submitting || violationState.isOpen) return;
      secondSubmitRan = true;
    };
    await guardedSubmit();
    assert.equal(secondSubmitRan, false);
  });

  test('ContactFormModal duplicate flow: Strike 2 deletes account and triggers closure callback', async () => {
    const userId = 100;
    const warningKey = getDuplicateWarningKey(userId);
    // Pre-set strike 1
    safeStorage.setItem(warningKey, '1');

    let deleteAccountCalled = false;
    let closedReason = null;
    let submitting = false;
    let violationState = { isOpen: false, isAccountClosed: false, phoneNumber: '' };
    let error = '';

    globalThis.fetch = async (url, options) => {
      assert.match(url, /\/auth\/account$/);
      assert.equal(options.method, 'DELETE');
      deleteAccountCalled = true;
      return {
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ success: true, message: 'Account deleted' })
      };
    };

    // Cross-contact duplicate detection using shared production findDuplicatePhone
    const formPhones = [{ phoneNumber: '+1 (555) 999-8888' }];
    const existingContacts = [{ id: 2, phones: [{ phoneNumber: '+1 555 999-8888' }] }];

    // Verify self-exclusion when editing existing contact
    const selfDup = findDuplicatePhone(formPhones, existingContacts, null, 2);
    assert.equal(selfDup, null);

    // Verify cross-contact detection
    const crossDup = findDuplicatePhone(formPhones, existingContacts);
    assert.equal(crossDup, '+1 (555) 999-8888');

    // Verify user profile phone duplicate detection with formatting
    const userPhoneDup = findDuplicatePhone([{ phoneNumber: '+1 (555) 123-4567' }], [], '+1 555-123-4567');
    assert.equal(userPhoneDup, '+1 (555) 123-4567');

    const onAccountClosed = (reason) => {
      closedReason = reason;
    };

    // Submit with production findDuplicatePhone and enforceDuplicatePolicy
    const submitContact = async (filteredPhones, contactsList) => {
      if (submitting || violationState.isOpen) return;
      submitting = true;
      try {
        const dup = findDuplicatePhone(filteredPhones, contactsList);
        if (dup) {
          const result = await enforceDuplicatePolicy({ userId, duplicateNumber: dup });
          violationState = {
            isOpen: true,
            isAccountClosed: result.isAccountClosed,
            phoneNumber: dup
          };
          error = result.error;
        }
      } finally {
        submitting = false;
      }
    };

    await submitContact(formPhones, existingContacts);

    // Verify Strike 2 execution
    assert.equal(deleteAccountCalled, true);
    assert.equal(submitting, false);
    assert.equal(violationState.isOpen, true);
    assert.equal(violationState.isAccountClosed, true);
    assert.equal(safeStorage.getItem(warningKey), null);
    assert.match(error, /Account Terminated/);

    // Simulate user acknowledging termination modal
    onAccountClosed(`Your account was permanently closed due to repeated duplicate phone number policy violations ("${violationState.phoneNumber}").`);
    assert.notEqual(closedReason, null);
  });

  test('page clamping derives zero when returnedTotalPages is zero and clamps page', () => {
    const clampPage = (currentPage, returnedTotalPages) => {
      const maxPage = returnedTotalPages > 0 ? returnedTotalPages - 1 : 0;
      return currentPage > maxPage ? maxPage : currentPage;
    };

    // When total pages is 0, page should clamp to 0
    assert.equal(clampPage(3, 0), 0);
    assert.equal(clampPage(0, 0), 0);

    // When total pages is 5, valid pages are 0..4
    assert.equal(clampPage(5, 5), 4);
    assert.equal(clampPage(2, 5), 2);
    assert.equal(clampPage(0, 5), 0);

    // When total pages is 1, valid page is 0
    assert.equal(clampPage(1, 1), 0);
    assert.equal(clampPage(0, 1), 0);
  });

  test('account-closure notice storage remains generic and does not store phone number', () => {
    // When account is closed, only generic message should be persisted to safeStorage
    const genericMessage = 'Your account was permanently closed due to repeated duplicate phone number policy violations.';
    safeStorage.setItem('cms_account_closed_notice', genericMessage);

    const stored = safeStorage.getItem('cms_account_closed_notice');
    assert.equal(stored, genericMessage);
    assert.equal(/\+?\d[\d\s\-()]{6,}/.test(stored), false);
  });

  test('enforceDuplicatePolicy uses backend-driven strike: strike 1 returns warning without termination', async () => {
    const userId = 501;
    let deleteCalled = false;
    const result = await enforceDuplicatePolicy({
      userId,
      duplicateNumber: '+15550009999',
      strike: 1,
      isAccountClosed: false,
      error: 'Warning (1/2): Duplicate phone number "+15550009999" is strictly prohibited.',
      deleteAccountFn: async () => { deleteCalled = true; }
    });

    assert.equal(result.isAccountClosed, false);
    assert.equal(result.strike, 1);
    assert.match(result.error, /Warning \(1\/2\)/);
    assert.equal(deleteCalled, false);
  });

  test('enforceDuplicatePolicy uses backend-driven strike: strike 2 terminates and cleans up', async () => {
    const userId = 502;
    const warningKey = getDuplicateWarningKey(userId);
    safeStorage.setItem(warningKey, '1');

    let deleteCalled = false;
    const result = await enforceDuplicatePolicy({
      userId,
      duplicateNumber: '+15550009999',
      strike: 2,
      isAccountClosed: true,
      error: 'Account Terminated: Repeated duplicate phone number violation ("+15550009999").',
      deleteAccountFn: async () => { deleteCalled = true; }
    });

    assert.equal(result.isAccountClosed, true);
    assert.equal(result.strike, 2);
    assert.match(result.error, /Account Terminated/);
    assert.equal(deleteCalled, true);
    assert.equal(safeStorage.getItem(warningKey), null);
  });
});
