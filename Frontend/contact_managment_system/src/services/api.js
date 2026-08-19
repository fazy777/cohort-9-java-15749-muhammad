import { safeStorage } from '../utils/storage';

const BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8080/api';
const DEFAULT_TIMEOUT_MS = 15000;
const TRANSFER_TIMEOUT_MS = 60000;

const getAuthHeader = () => {
  try {
    const token = safeStorage.getItem('cms_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  } catch (e) {
    console.warn('Failed to get auth token for request header:', e);
    return {};
  }
};

const handleUnauthorized = () => {
  safeStorage.removeItem('cms_token');
  safeStorage.removeItem('cms_user');
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }
};

const request = async (endpoint, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {})
  };

  let response;
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal
    });
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs / 1000}s`, { cause: err });
    }
    throw new Error(err?.message || 'Network error: Failed to connect to server', { cause: err });
  } finally {
    clearTimeout(timeoutId);
  }

  let result;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      result = await response.json();
    } catch {
      result = null;
    }
  } else {
    try {
      const text = await response.text();
      result = text ? { message: text } : null;
    } catch {
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
};

export const api = {
  async register(data) {
    if (!data) throw new Error('Registration data is required');
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async login(data) {
    if (!data) throw new Error('Login credentials are required');
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getProfile() {
    const result = await request('/auth/profile');
    return result?.data;
  },

  async changePassword(data) {
    if (!data) throw new Error('Change password data is required');
    return request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

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

  async getContactById(id) {
    if (id == null) throw new Error('Contact ID is required');
    const result = await request(`/contacts/${id}`);
    return result?.data;
  },

  async createContact(data) {
    if (!data) throw new Error('Contact payload is required');
    const result = await request('/contacts', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return result?.data;
  },

  async updateContact(id, data) {
    if (id == null) throw new Error('Contact ID is required');
    if (!data) throw new Error('Contact payload is required');
    const result = await request(`/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return result?.data;
  },

  async deleteContact(id) {
    if (id == null) throw new Error('Contact ID is required');
    return request(`/contacts/${id}`, {
      method: 'DELETE'
    });
  },

  async exportContacts() {
    const result = await request('/contacts/export', {}, TRANSFER_TIMEOUT_MS);
    return result?.data;
  },

  async importContacts(contactsList) {
    if (!Array.isArray(contactsList)) throw new Error('Contacts list must be an array');
    return request('/contacts/import', {
      method: 'POST',
      body: JSON.stringify(contactsList)
    }, TRANSFER_TIMEOUT_MS);
  }
};
