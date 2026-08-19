import { safeStorage } from '../utils/storage';

const BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8080/api';
const DEFAULT_TIMEOUT_MS = 15000;
const TRANSFER_TIMEOUT_MS = 60000;

/**
 * Builds the Authorization header containing the Bearer JWT token if present.
 * @returns {Record<string, string>}
 */
const getAuthHeader = () => {
  try {
    const token = safeStorage.getItem('cms_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  } catch (e) {
    console.warn('Failed to get auth token for request header:', e);
    return {};
  }
};

/**
 * Handles HTTP 401 Unauthorized by clearing cached session credentials and dispatching an auth event.
 * @returns {void}
 */
const handleUnauthorized = () => {
  safeStorage.removeItem('cms_token');
  safeStorage.removeItem('cms_user');
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }
};

/**
 * Performs an HTTP fetch request with timeout abort signal, centralized headers, and error handling.
 * @param {string} endpoint - API path relative to BASE_URL
 * @param {RequestInit} [options={}] - fetch options (method, body, headers)
 * @param {number} [timeoutMs=15000] - request timeout in milliseconds
 * @returns {Promise<any>}
 */
const request = async (endpoint, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {})
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal
    });

    let result;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        result = await response.json();
      } catch (parseErr) {
        if (controller.signal.aborted || parseErr?.name === 'AbortError') {
          throw parseErr;
        }
        result = null;
      }
    } else {
      try {
        const text = await response.text();
        result = text ? { message: text } : null;
      } catch (parseErr) {
        if (controller.signal.aborted || parseErr?.name === 'AbortError') {
          throw parseErr;
        }
        result = null;
      }
    }

    if (response.status === 401) {
      handleUnauthorized();
    }

    if (!response.ok) {
      const errorMessage = result?.message || result?.error || `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return result;
  } catch (err) {
    if (err?.name === 'AbortError' || controller.signal.aborted) {
      throw new Error(`Request timed out after ${timeoutMs / 1000}s`, { cause: err });
    }
    if (err instanceof Error && err.message && !err.message.startsWith('Network error:')) {
      throw err;
    }
    throw new Error(err?.message || 'Network error: Failed to connect to server', { cause: err });
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * API client exposing backend authentication and contact management endpoints.
 */
export const api = {
  /**
   * Registers a new user account.
   * @param {Object} data - user registration data
   * @returns {Promise<any>}
   */
  async register(data) {
    if (!data) throw new Error('Registration data is required');
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  /**
   * Authenticates user credentials.
   * @param {Object} data - login credentials
   * @returns {Promise<any>}
   */
  async login(data) {
    if (!data) throw new Error('Login credentials are required');
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  /**
   * Fetches the current user profile.
   * @returns {Promise<any>}
   */
  async getProfile() {
    const result = await request('/auth/profile');
    return result?.data;
  },

  /**
   * Changes the authenticated user's password.
   * @param {Object} data - password change payload
   * @returns {Promise<any>}
   */
  async changePassword(data) {
    if (!data) throw new Error('Change password data is required');
    return request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  /**
   * Fetches a paginated, filtered list of contacts.
   * @param {Object} [params] - query parameters
   * @returns {Promise<any>}
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
    return result?.data;
  },

  /**
   * Fetches details of a single contact by ID.
   * @param {number|string} id - contact ID
   * @returns {Promise<any>}
   */
  async getContactById(id) {
    if (id == null) throw new Error('Contact ID is required');
    const result = await request(`/contacts/${id}`);
    return result?.data;
  },

  /**
   * Creates a new contact.
   * @param {Object} data - contact details
   * @returns {Promise<any>}
   */
  async createContact(data) {
    if (!data) throw new Error('Contact payload is required');
    const result = await request('/contacts', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return result?.data;
  },

  /**
   * Updates an existing contact.
   * @param {number|string} id - contact ID
   * @param {Object} data - updated contact payload
   * @returns {Promise<any>}
   */
  async updateContact(id, data) {
    if (id == null) throw new Error('Contact ID is required');
    if (!data) throw new Error('Contact payload is required');
    const result = await request(`/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return result?.data;
  },

  /**
   * Deletes a contact by ID.
   * @param {number|string} id - contact ID
   * @returns {Promise<any>}
   */
  async deleteContact(id) {
    if (id == null) throw new Error('Contact ID is required');
    return request(`/contacts/${id}`, {
      method: 'DELETE'
    });
  },

  /**
   * Exports all contacts for the authenticated user.
   * @returns {Promise<any>}
   */
  async exportContacts() {
    const result = await request('/contacts/export', {}, TRANSFER_TIMEOUT_MS);
    return result?.data;
  },

  /**
   * Imports a batch list of contacts.
   * @param {Array<Object>} contactsList - contacts to import
   * @returns {Promise<any>}
   */
  async importContacts(contactsList) {
    if (!Array.isArray(contactsList)) throw new Error('Contacts list must be an array');
    return request('/contacts/import', {
      method: 'POST',
      body: JSON.stringify(contactsList)
    }, TRANSFER_TIMEOUT_MS);
  }
};
