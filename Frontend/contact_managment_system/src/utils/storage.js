/**
 * @file Safe browser session storage helper with memory fallback and exception handling.
 */

const memoryStore = new Map();

/**
 * Clean up legacy localStorage items that may contain sensitive data from previous versions.
 */
export const cleanupLegacyStorage = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('cms_token');
      window.localStorage.removeItem('cms_user');
    }
  } catch (e) {
    console.warn('Failed to clean legacy localStorage:', e);
  }
};

export const safeStorage = {
  /**
   * Retrieve item from sessionStorage with fallback to in-memory store.
   * @param {string} key
   * @returns {string | null}
   */
  getItem(key) {
    if (memoryStore.has(key)) {
      return memoryStore.get(key) ?? null;
    }
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        return window.sessionStorage.getItem(key);
      }
    } catch (e) {
      console.warn('Browser storage read failed, using memory store:', e);
    }
    return null;
  },

  /**
   * Store item in sessionStorage with fallback to in-memory store.
   * @param {string} key
   * @param {string} value
   */
  setItem(key, value) {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(key, value);
        memoryStore.delete(key);
        return;
      }
    } catch (e) {
      console.warn('Browser storage write failed, using memory store:', e);
    }
    memoryStore.set(key, String(value));
  },

  /**
   * Remove item from sessionStorage and in-memory store.
   * @param {string} key
   */
  removeItem(key) {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(key);
      }
    } catch (e) {
      console.warn('Browser storage remove failed:', e);
    }
    memoryStore.delete(key);
  },

  /**
   * Clear all application-specific items from sessionStorage and in-memory store.
   */
  clear() {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const keysToRemove = [];
        for (let i = 0; i < window.sessionStorage.length; i++) {
          const key = window.sessionStorage.key(i);
          if (key && key.startsWith('cms_')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => {
          window.sessionStorage.removeItem(key);
        });
      }
    } catch (e) {
      console.warn('Browser storage clear failed:', e);
    }
    memoryStore.clear();
  }
};
