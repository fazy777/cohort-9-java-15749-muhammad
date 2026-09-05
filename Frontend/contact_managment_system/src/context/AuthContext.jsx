/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { api, getSessionGeneration, incrementSessionGeneration } from '../services/api.js';
import { safeStorage, cleanupLegacyStorage } from '../utils/storage.js';

const AuthContext = createContext(null);

/**
 * Authentication Context Provider that maintains user authentication state and login/logout handlers.
 * Authentication tokens are managed transparently and securely via HttpOnly/SameSite cookies.
 *
 * @param {{ children: import('react').ReactNode }} props
 * @returns {JSX.Element}
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = safeStorage.getItem('cms_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  /**
   * Helper that purges client user authentication state and storage.
   */
  const clearAuthState = useCallback(() => {
    setUser(null);
    setLoading(false);
    safeStorage.removeItem('cms_user');
    cleanupLegacyStorage();
  }, []);

  /**
   * Logs out the user, clears backend HttpOnly session cookies, and purges client user state.
   */
  const logout = useCallback(async () => {
    incrementSessionGeneration();
    try {
      await api.logout();
    } catch (err) {
      console.warn('Logout request failed:', err);
      throw err;
    } finally {
      clearAuthState();
    }
  }, [clearAuthState]);

  useEffect(() => {
    cleanupLegacyStorage();
    let isActive = true;

    const initAuth = async () => {
      const requestGen = getSessionGeneration();
      try {
        // Validate active session with backend via HttpOnly cookies
        const freshUser = await api.getProfile();
        if (isActive && getSessionGeneration() === requestGen) {
          if (freshUser) {
            setUser(freshUser);
            safeStorage.setItem('cms_user', JSON.stringify(freshUser));
          } else {
            setUser(null);
            safeStorage.removeItem('cms_user');
          }
        }
      } catch (err) {
        if (isActive && getSessionGeneration() === requestGen) {
          setUser(null);
          safeStorage.removeItem('cms_user');
        }
        console.warn('Session verification failed:', err);
      } finally {
        if (isActive && getSessionGeneration() === requestGen) {
          setLoading(false);
        }
      }
    };

    void initAuth();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    const handleUnauthorizedEvent = (event) => {
      const eventGen = event?.detail?.generation;
      if (typeof eventGen === 'number' && eventGen < getSessionGeneration()) {
        return;
      }
      clearAuthState();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('auth:unauthorized', handleUnauthorizedEvent);
      return () => {
        window.removeEventListener('auth:unauthorized', handleUnauthorizedEvent);
      };
    }
  }, [clearAuthState]);

  /**
   * Helper that updates authentication state upon login/register success.
   * @param {import('../services/api').AuthResponseData} data - response auth data containing user fields
   * @returns {{ id: number|string, firstName: string, lastName: string, email: string|null, phone: string|null }}
   */
  const handleAuthSuccess = useCallback((data) => {
    if (!data || typeof data !== 'object' || data.id == null || !data.firstName) {
      throw new Error('Invalid authentication response: missing required user properties');
    }

    const userObj = {
      id: data.id,
      firstName: data.firstName,
      lastName: data.lastName || '',
      email: data.email || null,
      phone: data.phone || null
    };

    setUser(userObj);
    setLoading(false);
    safeStorage.setItem('cms_user', JSON.stringify(userObj));
    cleanupLegacyStorage();
    return userObj;
  }, []);

  /**
   * Logs in a user with credentials.
   * @param {{ credential: string, password: string }} credentials - user login credentials
   * @returns {Promise<{ id: number|string, firstName: string, lastName: string, email: string|null, phone: string|null } | null>} authenticated user object
   */
  const login = useCallback(async (credentials) => {
    if (!credentials) throw new Error('Credentials are required');
    const requestGen = incrementSessionGeneration();
    try {
      const res = await api.login(credentials);
      const data = res?.data;
      if (!data) throw new Error('Invalid login response from server');

      if (getSessionGeneration() !== requestGen) {
        return null;
      }
      return handleAuthSuccess(data);
    } catch (err) {
      if (getSessionGeneration() !== requestGen || err?.name === 'AbortError' || err?.message?.includes('aborted') || err?.message?.includes('superseded')) {
        return null;
      }
      throw err;
    }
  }, [handleAuthSuccess]);

  /**
   * Registers a new user account.
   * @param {{ firstName: string, lastName: string, email?: string|null, phone?: string|null, password: string }} registerData - registration form data
   * @returns {Promise<{ id: number|string, firstName: string, lastName: string, email: string|null, phone: string|null } | null>} newly registered user object
   */
  const register = useCallback(async (registerData) => {
    if (!registerData) throw new Error('Registration data is required');
    const requestGen = incrementSessionGeneration();
    try {
      const res = await api.register(registerData);
      const data = res?.data;
      if (!data) throw new Error('Invalid register response from server');

      if (getSessionGeneration() !== requestGen) {
        return null;
      }
      return handleAuthSuccess(data);
    } catch (err) {
      if (getSessionGeneration() !== requestGen || err?.name === 'AbortError' || err?.message?.includes('aborted') || err?.message?.includes('superseded')) {
        return null;
      }
      throw err;
    }
  }, [handleAuthSuccess]);

  /**
   * Refreshes user profile information from the API.
   * @returns {Promise<void>}
   */
  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const requestGen = getSessionGeneration();
    try {
      const profile = await api.getProfile();
      if (profile && getSessionGeneration() === requestGen) {
        setUser(profile);
        safeStorage.setItem('cms_user', JSON.stringify(profile));
      }
    } catch (err) {
      console.warn('Failed to refresh user profile:', err);
    }
  }, [user]);

  /**
   * Directly updates user profile fields in memory and persistent storage.
   * @param {Partial<import('../services/api').UserProfile>} updatedFields
   * @param {number|string} [expectedUserId] - optional user ID to guard against stale updates across sessions
   */
  const updateUser = useCallback((updatedFields, expectedUserId) => {
    if (!updatedFields || typeof updatedFields !== 'object') return;
    setUser((prev) => {
      if (!prev) return prev;
      if (expectedUserId !== undefined && expectedUserId !== null && String(prev.id) !== String(expectedUserId)) {
        return prev;
      }
      const merged = { ...prev, ...updatedFields };
      safeStorage.setItem('cms_user', JSON.stringify(merged));
      return merged;
    });
  }, []);

  const contextValue = useMemo(() => ({
    user,
    loading,
    login,
    register,
    logout,
    refreshProfile,
    updateUser
  }), [user, loading, login, register, logout, refreshProfile, updateUser]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to consume the AuthContext.
 * @returns {{
 *   user: { id: number|string, firstName: string, lastName: string, email: string|null, phone: string|null } | null,
 *   loading: boolean,
 *   login: (credentials: { credential: string, password: string }) => Promise<{ id: number|string, firstName: string, lastName: string, email: string|null, phone: string|null } | null>,
 *   register: (registerData: { firstName: string, lastName: string, email?: string|null, phone?: string|null, password: string }) => Promise<{ id: number|string, firstName: string, lastName: string, email: string|null, phone: string|null } | null>,
 *   logout: () => Promise<void>,
 *   refreshProfile: () => Promise<void>
 * }} auth context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

