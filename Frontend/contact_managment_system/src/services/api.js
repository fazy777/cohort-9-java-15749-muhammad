import { safeStorage } from '../utils/storage';

const BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8080/api';

const getAuthHeader = () => {
  try {
    const token = safeStorage.getItem('cms_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  } catch (e) {
    console.warn('Failed to get auth token for request header:', e);
    return {};
  }
};

export const api = {
  async register(data) {
    if (!data) throw new Error('Registration data is required');
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result?.message || 'Registration failed');
    return result;
  },

  async login(data) {
    if (!data) throw new Error('Login credentials are required');
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result?.message || 'Login failed');
    return result;
  },

  async getProfile() {
    const res = await fetch(`${BASE_URL}/auth/profile`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result?.message || 'Failed to load user profile');
    return result?.data;
  },

  async changePassword(data) {
    if (!data) throw new Error('Change password data is required');
    const res = await fetch(`${BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result?.message || 'Failed to change password');
    return result;
  },

  async getContacts({ search = '', page = 0, size = 10, sortBy = 'firstName', sortDir = 'asc' } = {}) {
    const queryParams = new URLSearchParams({
      page: String(page >= 0 ? page : 0),
      size: String(size > 0 ? size : 10),
      sortBy: sortBy || 'firstName',
      sortDir: sortDir || 'asc',
      ...(search ? { search: search.trim() } : {})
    });

    const res = await fetch(`${BASE_URL}/contacts?${queryParams.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result?.message || 'Failed to fetch contacts');
    return result?.data;
  },

  async getContactById(id) {
    if (id == null) throw new Error('Contact ID is required');
    const res = await fetch(`${BASE_URL}/contacts/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result?.message || 'Failed to fetch contact details');
    return result?.data;
  },

  async createContact(data) {
    if (!data) throw new Error('Contact payload is required');
    const res = await fetch(`${BASE_URL}/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result?.message || 'Failed to create contact');
    return result?.data;
  },

  async updateContact(id, data) {
    if (id == null) throw new Error('Contact ID is required');
    if (!data) throw new Error('Contact payload is required');
    const res = await fetch(`${BASE_URL}/contacts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result?.message || 'Failed to update contact');
    return result?.data;
  },

  async deleteContact(id) {
    if (id == null) throw new Error('Contact ID is required');
    const res = await fetch(`${BASE_URL}/contacts/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result?.message || 'Failed to delete contact');
    return result;
  },

  async exportContacts() {
    const res = await fetch(`${BASE_URL}/contacts/export`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result?.message || 'Failed to export contacts');
    return result?.data;
  },

  async importContacts(contactsList) {
    if (!Array.isArray(contactsList)) throw new Error('Contacts list must be an array');
    const res = await fetch(`${BASE_URL}/contacts/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(contactsList)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result?.message || 'Failed to import contacts');
    return result;
  }
};
