import { safeStorage } from '../utils/storage.js';

export const normalizeApiUrl = (url) => {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return 'http://localhost:8080/api';
  }
  let clean = url.trim().replace(/\/+$/, '');
  if (!clean.startsWith('http://') && !clean.startsWith('https://') && !clean.startsWith('/')) {
    clean = `https://${clean}`;
  }
  if (!clean.endsWith('/api')) {
    clean += '/api';
  }
  return clean;
};

const BASE_URL = normalizeApiUrl(import.meta.env?.VITE_API_URL);
const DEFAULT_TIMEOUT_MS = 15000;
const TRANSFER_TIMEOUT_MS = 60000;

/**
 * Generic API response envelope.
 * @template [T=void]
 * @typedef {Object} ApiResponse
 * @property {boolean} success
 * @property {string} [message]
 * @property {T} [data]
 */

/**
 * @typedef {Object} UserProfile
 * @property {number|string} id
 * @property {string} firstName
 * @property {string} lastName
 * @property {string|null} email
 * @property {string|null} phone
 */

/**
 * @typedef {Object} AuthResponseData
 * @property {number|string} id
 * @property {string} firstName
 * @property {string} lastName
 * @property {string|null} email
 * @property {string|null} phone
 */

/**
 * @typedef {Object} RegisterPayload
 * @property {string} firstName
 * @property {string} lastName
 * @property {string|null} [email]
 * @property {string|null} [phone]
 * @property {string} password
 */

/**
 * @typedef {Object} LoginPayload
 * @property {string} credential
 * @property {string} password
 */

/**
 * @typedef {Object} ChangePasswordPayload
 * @property {string} currentPassword
 * @property {string} newPassword
 */

/**
 * @typedef {Object} ContactEmailDto
 * @property {number|string} [id]
 * @property {string} email
 * @property {'WORK'|'PERSONAL'|'OTHER'} [label]
 */

/**
 * @typedef {Object} ContactPhoneDto
 * @property {number|string} [id]
 * @property {string} phoneNumber
 * @property {'WORK'|'HOME'|'PERSONAL'|'MOBILE'|'OTHER'} [label]
 */

/**
 * @typedef {Object} ContactDto
 * @property {number|string} [id]
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} [title]
 * @property {string} [notes]
 * @property {ContactEmailDto[]} [emails]
 * @property {ContactPhoneDto[]} [phones]
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 */

/**
 * @typedef {Object} PagedContacts
 * @property {ContactDto[]} content
 * @property {number} page
 * @property {number} size
 * @property {number} totalElements
 * @property {number} totalPages
 * @property {boolean} last
 */

/**
 * @typedef {Object} ContactQueryParams
 * @property {string} [search]
 * @property {number} [page]
 * @property {number} [size]
 * @property {string} [sortBy]
 * @property {'asc'|'desc'} [sortDir]
 */

let sessionGeneration = 0;
let activeAuthAbortController = null;
let authQueue = Promise.resolve();

/**
 * Returns the current non-secret authentication session generation counter.
 * @returns {number}
 */
export const getSessionGeneration = () => sessionGeneration;

/**
 * Increments and returns the session generation counter when auth state changes (login, register, logout).
 * @returns {number}
 */
export const incrementSessionGeneration = () => {
  sessionGeneration += 1;
  return sessionGeneration;
};

/**
 * Resets the session generation counter and cancels pending auth attempts (primarily used for test cleanup).
 * @param {number} [val=0]
 * @returns {number}
 */
export const resetSessionGeneration = (val = 0) => {
  if (activeAuthAbortController) {
    try {
      activeAuthAbortController.abort();
    } catch {
      // ignore
    }
    activeAuthAbortController = null;
  }
  authQueue = Promise.resolve();
  sessionGeneration = val;
  return sessionGeneration;
};

/**
 * Serializes auth operations and invalidates obsolete in-flight attempts.
 * Ensures that prior auth attempts are aborted at the network level so their Set-Cookie
 * response headers cannot activate or overwrite the browser session.
 *
 * @template T
 * @param {(signal: AbortSignal) => Promise<T>} authFn
 * @returns {Promise<T>}
 */
const serializeAuth = (authFn) => {
  if (activeAuthAbortController) {
    try {
      activeAuthAbortController.abort();
    } catch {
      // ignore
    }
  }
  const controller = new AbortController();
  activeAuthAbortController = controller;

  const execute = async () => {
    try {
      return await authFn(controller.signal);
    } finally {
      if (activeAuthAbortController === controller) {
        activeAuthAbortController = null;
      }
    }
  };

  const nextPromise = authQueue.then(execute, execute);
  authQueue = nextPromise.catch(() => {});
  return nextPromise;
};

/**
 * Extracts CSRF token from the XSRF-TOKEN cookie if present.
 * Safely handles malformed percent-encoding by returning null on URIError.
 * @returns {string | null}
 */
export const getCsrfToken = () => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch (err) {
    if (err instanceof URIError) {
      return null;
    }
    throw err;
  }
};

/**
 * Handles HTTP 401 Unauthorized by clearing cached session credentials and dispatching an auth event.
 * Discards stale 401 events that belong to older session generations.
 * @param {number} [requestGeneration] - generation when the request was initiated
 * @returns {void}
 */
export const handleUnauthorized = (requestGeneration) => {
  const currentGen = getSessionGeneration();
  if (typeof requestGeneration === 'number' && requestGeneration < currentGen) {
    return;
  }
  safeStorage.removeItem('cms_user');
  safeStorage.removeItem('cms_auth_token');
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth:unauthorized', {
      detail: { generation: typeof requestGeneration === 'number' ? requestGeneration : currentGen }
    }));
  }
};

/**
 * Validates that an object contains required user fields (id and non-empty firstName).
 * @param {any} user - candidate user object
 * @returns {boolean}
 */
const isValidUserData = (user) => {
  return (
    user != null &&
    typeof user === 'object' &&
    (typeof user.id === 'number' || (typeof user.id === 'string' && user.id.trim().length > 0)) &&
    typeof user.firstName === 'string' &&
    user.firstName.trim().length > 0
  );
};

/**
 * Performs an HTTP fetch request with timeout abort signal, credentials for HttpOnly cookies,
 * centralized CSRF headers, and error handling.
 * @param {string} endpoint - API path relative to BASE_URL
 * @param {RequestInit} [options={}] - fetch options (method, body, headers)
 * @param {number} [timeoutMs=15000] - request timeout in milliseconds
 * @returns {Promise<unknown>}
 */
const request = async (endpoint, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) => {
  const requestGeneration = getSessionGeneration();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const isAuthEndpoint = endpoint.startsWith('/auth/login') || endpoint.startsWith('/auth/register');
  const method = (options.method || 'GET').toUpperCase();
  const isMutating = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
  const csrfToken = isMutating ? getCsrfToken() : null;
  const authToken = safeStorage.getItem('cms_auth_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
    ...(csrfToken ? { 'X-XSRF-TOKEN': csrfToken } : {}),
    ...(options.headers || {})
  };

  const { signal: callerSignal, ...fetchOptions } = options;
  if (callerSignal) {
    if (callerSignal.aborted) {
      controller.abort();
    } else {
      callerSignal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
      credentials: 'include',
      signal: controller.signal
    });

    let result;
    const contentType = response.headers?.get?.('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        result = await response.json();
      } catch (parseErr) {
        if (controller.signal.aborted || callerSignal?.aborted || parseErr?.name === 'AbortError') {
          throw parseErr;
        }
        result = null;
      }
    } else {
      try {
        const text = await response.text();
        result = text ? { message: text } : null;
      } catch (parseErr) {
        if (controller.signal.aborted || callerSignal?.aborted || parseErr?.name === 'AbortError') {
          throw parseErr;
        }
        result = null;
      }
    }

    if (response.status === 401 && !isAuthEndpoint) {
      handleUnauthorized(requestGeneration);
    }

    if (!response.ok) {
      const errorMessage = (result && typeof result === 'object' && ('message' in result || 'error' in result))
        ? (result.message || result.error)
        : `Request failed with status ${response.status}`;
      const err = new Error(errorMessage);
      if (result && typeof result === 'object') {
        err.status = response.status;
        err.response = result;
        if (result.strike !== undefined) err.strike = result.strike;
        if (result.accountClosed !== undefined) err.accountClosed = Boolean(result.accountClosed);
        if (result.duplicateNumber !== undefined) err.duplicateNumber = result.duplicateNumber;
      }
      throw err;
    }

    if (result != null && typeof result !== 'object') {
      throw new Error('Invalid response shape from server');
    }

    return result;
  } catch (err) {
    if (callerSignal?.aborted) {
      const abortErr = new Error('Authentication request was superseded or aborted', { cause: err });
      abortErr.name = 'AbortError';
      throw abortErr;
    }
    if (err?.name === 'AbortError' || controller.signal.aborted) {
      throw new Error(`Request timed out after ${timeoutMs / 1000}s`, { cause: err });
    }
    const isNetworkError =
      err instanceof TypeError ||
      err?.message === 'Failed to fetch' ||
      err?.message === 'Load failed' ||
      err?.message === 'fetch failed' ||
      err?.name === 'FetchError';

    if (!isNetworkError && err instanceof Error && err.message && !err.message.startsWith('Network error:')) {
      throw err;
    }
    throw new Error('Network error: Failed to connect to server', { cause: err });
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * API client exposing backend authentication and contact management endpoints.
 */
export const api = {
  /**
   * Registers a new user account and receives an HttpOnly session cookie.
   * Serializes with other auth mutations and invalidates any obsolete in-flight attempt.
   * @param {RegisterPayload} data - user registration data
   * @returns {Promise<ApiResponse<AuthResponseData>>}
   */
  async register(data) {
    if (!data) throw new Error('Registration data is required');
    return serializeAuth(async (signal) => {
      const result = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
        signal
      });
      if (!result || typeof result !== 'object' || !isValidUserData(result.data)) {
        throw new Error('Invalid response shape from server: missing or invalid user data');
      }
      if (result.data?.token) {
        safeStorage.setItem('cms_auth_token', result.data.token);
      }
      return result;
    });
  },

  /**
   * Authenticates user credentials and receives an HttpOnly session cookie.
   * Serializes with other auth mutations and invalidates any obsolete in-flight attempt.
   * @param {LoginPayload} data - login credentials
   * @returns {Promise<ApiResponse<AuthResponseData>>}
   */
  async login(data) {
    if (!data) throw new Error('Login credentials are required');
    return serializeAuth(async (signal) => {
      const result = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
        signal
      });
      if (!result || typeof result !== 'object' || !isValidUserData(result.data)) {
        throw new Error('Invalid response shape from server: missing or invalid user data');
      }
      if (result.data?.token) {
        safeStorage.setItem('cms_auth_token', result.data.token);
      }
      return result;
    });
  },

  /**
   * Logs out the user and instructs the backend to clear the HttpOnly session cookie.
   * Serializes with other auth mutations and cancels any pending login/register attempts.
   * @returns {Promise<ApiResponse<void>>}
   */
  async logout() {
    return serializeAuth(async (signal) => {
      try {
        const result = await request('/auth/logout', {
          method: 'POST',
          signal
        });
        if (!result || typeof result !== 'object') {
          throw new Error('Invalid logout response shape from server');
        }
        return result;
      } finally {
        safeStorage.removeItem('cms_user');
        safeStorage.removeItem('cms_auth_token');
      }
    });
  },

  /**
   * Fetches the current user profile.
   * @returns {Promise<UserProfile | null>}
   */
  async getProfile() {
    const result = await request('/auth/profile');
    if (!result || typeof result !== 'object' || !result.data) {
      return null;
    }
    if (!isValidUserData(result.data)) {
      throw new Error('Invalid profile response shape from server');
    }
    return result.data;
  },

  /**
   * Changes the authenticated user's password.
   * @param {ChangePasswordPayload} data - password change payload
   * @returns {Promise<ApiResponse<void>>}
   */
  async changePassword(data) {
    if (!data) throw new Error('Change password data is required');
    const result = await request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid change password response shape from server');
    }
    return result;
  },

  /**
   * Updates or adds the authenticated user's phone number.
   * @param {{ phone: string }} data - phone update payload
   * @returns {Promise<UserProfile | null>}
   */
  async updatePhone(data) {
    if (!data || !data.phone) throw new Error('Phone number is required');
    const result = await request('/auth/phone', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    if (!result || typeof result !== 'object' || !result.data) {
      throw new Error('Invalid update phone response shape from server');
    }
    return result.data;
  },

  /**
   * Permanently closes and deletes the authenticated user's account and all contacts.
   * @returns {Promise<ApiResponse<void>>}
   */
  async deleteAccount() {
    return serializeAuth(async (signal) => {
      const result = await request('/auth/account', {
        method: 'DELETE',
        signal
      });
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid delete account response shape from server');
      }
      safeStorage.removeItem('cms_user');
      safeStorage.removeItem('cms_auth_token');
      return result;
    });
  },

  /**
   * Fetches a paginated, filtered list of contacts.
   * @param {ContactQueryParams} [params] - query parameters
   * @returns {Promise<PagedContacts | null>}
   */
  async getContacts({ search = '', page = 0, size = 10, sortBy = 'firstName', sortDir = 'asc' } = {}) {
    const trimmedSearch = typeof search === 'string' ? search.trim() : '';
    const queryParams = new URLSearchParams({
      page: String(page >= 0 ? page : 0),
      size: String(size > 0 ? size : 10),
      sortBy: sortBy || 'firstName',
      sortDir: sortDir || 'asc',
      ...(trimmedSearch ? { search: trimmedSearch } : {})
    });

    const result = await request(`/contacts?${queryParams.toString()}`);
    if (!result || typeof result !== 'object' || !result.data) {
      return null;
    }
    if (typeof result.data !== 'object' || !Array.isArray(result.data.content)) {
      throw new Error('Invalid contacts response shape from server');
    }
    return result.data;
  },

  /**
   * Fetches details of a single contact by ID.
   * @param {number|string} id - contact ID
   * @returns {Promise<ContactDto | null>}
   */
  async getContactById(id) {
    if (id == null) throw new Error('Contact ID is required');
    const result = await request(`/contacts/${id}`);
    if (!result || typeof result !== 'object' || !result.data) {
      return null;
    }
    if (typeof result.data !== 'object' || result.data.id == null) {
      throw new Error('Invalid contact response shape from server');
    }
    return result.data;
  },

  /**
   * Creates a new contact.
   * @param {ContactDto} data - contact details
   * @returns {Promise<ContactDto | null>}
   */
  async createContact(data) {
    if (!data) throw new Error('Contact payload is required');
    const result = await request('/contacts', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (!result || typeof result !== 'object' || !result.data) {
      return null;
    }
    if (typeof result.data !== 'object' || result.data.id == null) {
      throw new Error('Invalid contact creation response shape from server');
    }
    return result.data;
  },

  /**
   * Updates an existing contact.
   * @param {number|string} id - contact ID
   * @param {ContactDto} data - updated contact payload
   * @returns {Promise<ContactDto | null>}
   */
  async updateContact(id, data) {
    if (id == null) throw new Error('Contact ID is required');
    if (!data) throw new Error('Contact payload is required');
    const result = await request(`/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    if (!result || typeof result !== 'object' || !result.data) {
      return null;
    }
    if (typeof result.data !== 'object' || result.data.id == null) {
      throw new Error('Invalid contact update response shape from server');
    }
    return result.data;
  },

  /**
   * Deletes a contact by ID.
   * @param {number|string} id - contact ID
   * @returns {Promise<ApiResponse<void>>}
   */
  async deleteContact(id) {
    if (id == null) throw new Error('Contact ID is required');
    const result = await request(`/contacts/${id}`, {
      method: 'DELETE'
    });
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid delete contact response shape from server');
    }
    return result;
  },

  /**
   * Exports all contacts for the authenticated user.
   * @returns {Promise<ContactDto[] | null>}
   */
  async exportContacts() {
    const result = await request('/contacts/export', {}, TRANSFER_TIMEOUT_MS);
    if (!result || typeof result !== 'object' || !result.data) {
      return null;
    }
    if (!Array.isArray(result.data)) {
      throw new Error('Invalid contact export response shape from server');
    }
    return result.data;
  },

  /**
   * Imports a batch list of contacts.
   * @param {ContactDto[]} contactsList - contacts to import
   * @returns {Promise<ApiResponse<number>>}
   */
  async importContacts(contactsList) {
    if (!Array.isArray(contactsList)) throw new Error('Contacts list must be an array');
    const result = await request('/contacts/import', {
      method: 'POST',
      body: JSON.stringify(contactsList)
    }, TRANSFER_TIMEOUT_MS);
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid contact import response shape from server');
    }
    return result;
  },

  getSessionGeneration,
  incrementSessionGeneration,
  resetSessionGeneration,
  getCsrfToken,
  handleUnauthorized
};

