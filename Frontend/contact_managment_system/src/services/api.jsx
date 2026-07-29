/**
 * @file Axios-based API service for Contact Management System.
 * Implements exception handling, null checks, and typed responses.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

/**
 * Validates that a value is not null or undefined.
 * @template T
 * @param {T|null|undefined} value
 * @param {string} paramName
 * @returns {T}
 * @throws {Error} If value is null
 */
function requireNonNull(value, paramName) {
  if (value == null) {
    throw new Error(`${paramName} must not be null or undefined`)
  }
  return value
}

/**
 * Generic API request wrapper with exception handling.
 * @template T
 * @param {string} endpoint
 * @param {RequestInit} [options]
 * @returns {Promise<T>}
 */
async function apiRequest(endpoint, options = {}) {
  try {
    requireNonNull(endpoint, 'endpoint')

    if (typeof endpoint !== 'string' || endpoint.trim() === '') {
      throw new Error('endpoint must be a non-empty string')
    }

    const url = `${API_BASE_URL}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    // Null check for body serialization
    if (config.body != null && typeof config.body !== 'string') {
      config.body = JSON.stringify(config.body)
    }

    const response = await fetch(url, config)

    if (response == null) {
      throw new Error('Fetch returned null response')
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`API Error ${response.status}: ${errorText}`)
    }

    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json()
      if (data == null) {
        throw new Error('API returned null JSON data')
      }
      return /** @type {T} */ (data)
    }

    return /** @type {T} */ (await response.text())
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown API error'
    console.error(`API request failed for ${endpoint}:`, message, error)
    throw new Error(message, { cause: error })
  }
}

/**
 * Contact API service with CRUD operations and proper OOP structure.
 */
export const contactService = {
  /**
   * Get all contacts with pagination.
   * @param {number} [page=0]
   * @param {number} [size=10]
   * @param {string} [search]
   * @returns {Promise<unknown>}
   */
  async getAllContacts(page = 0, size = 10, search) {
    try {
      if (typeof page !== 'number' || page < 0) {
        throw new Error('page must be a non-negative number')
      }
      if (typeof size !== 'number' || size <= 0) {
        throw new Error('size must be a positive number')
      }

      const params = new URLSearchParams({
        page: String(page),
        size: String(size),
      })

      if (search != null && search.trim() !== '') {
        params.append('search', search.trim())
      }

      return await apiRequest(`/contacts?${params.toString()}`)
    } catch (error) {
      console.error('getAllContacts failed:', error)
      throw error instanceof Error ? error : new Error(String(error), { cause: error })
    }
  },

/**
   * Get contact by ID.
   * @param {number} id
   * @returns {Promise<unknown>}
   */
  async getContactById(id) {
    try {
      requireNonNull(id, 'id')
      if (typeof id !== 'number' || id <= 0) {
        throw new Error('id must be a positive number')
      }
      return await apiRequest(`/contacts/${id}`)
    } catch (error) {
      console.error(`getContactById ${id} failed:`, error)
      throw error instanceof Error ? error : new Error(String(error), { cause: error })
    }
  },

  /**
   * Create contact.
   * @param {Object} contactData
   * @returns {Promise<unknown>}
   */
  async createContact(contactData) {
    try {
      requireNonNull(contactData, 'contactData')
      if (typeof contactData !== 'object') {
        throw new Error('contactData must be an object')
      }
      return await apiRequest('/contacts', {
        method: 'POST',
        body: contactData,
      })
    } catch (error) {
      console.error('createContact failed:', error)
      throw error instanceof Error ? error : new Error(String(error), { cause: error })
    }
  },

  /**
   * Update contact.
   * @param {number} id
   * @param {Object} contactData
   * @returns {Promise<unknown>}
   */
  async updateContact(id, contactData) {
    try {
      requireNonNull(id, 'id')
      requireNonNull(contactData, 'contactData')
      return await apiRequest(`/contacts/${id}`, {
        method: 'PUT',
        body: contactData,
      })
    } catch (error) {
      console.error(`updateContact ${id} failed:`, error)
      throw error instanceof Error ? error : new Error(String(error), { cause: error })
    }
  },

  /**
   * Delete contact.
   * @param {number} id
   * @returns {Promise<unknown>}
   */
  async deleteContact(id) {
    try {
      requireNonNull(id, 'id')
      return await apiRequest(`/contacts/${id}`, {
        method: 'DELETE',
      })
    } catch (error) {
      console.error(`deleteContact ${id} failed:`, error)
      throw error instanceof Error ? error : new Error(String(error), { cause: error })
    }
  },
}

export default contactService
