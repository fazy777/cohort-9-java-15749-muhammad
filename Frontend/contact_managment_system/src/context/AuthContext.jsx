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
   * Logs out the user, clears backend HttpOnly session cookies, and purges client user state.
   */
  const logout = useCallback(async () => {
    incrementSessionGeneration();
    try {
      await api.logout();
    } catch (err) {
      console.warn('Logout request failed:', err);
    } finally {
      setUser(null);
      setLoading(false);
      safeStorage.removeItem('cms_user');
      cleanupLegacyStorage();
    }
  }, []);

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
      void logout();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('auth:unauthorized', handleUnauthorizedEvent);
      return () => {
        window.removeEventListener('auth:unauthorized', handleUnauthorizedEvent);
      };
    }
  }, [logout]);

  /**
   * Helper that updates authentication state upon login/register success.
   * @param {import('../services/api').AuthResponseData} data - response auth data containing user fields
   * @returns {{ id: number|string, firstName: string, lastName: string, email: string|null, phone: string|null }}
   */
  const handleAuthSuccess = useCallback((data) => {
    const userObj = {
      id: data.id,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone
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
   * @returns {Promise<{ id: number|string, firstName: string, lastName: string, email: string|null, phone: string|null }>} authenticated user object
   */
  const login = useCallback(async (credentials) => {
    if (!credentials) throw new Error('Credentials are required');
    const res = await api.login(credentials);
    const data = res?.data;
    if (!data) throw new Error('Invalid login response from server');

    incrementSessionGeneration();
    return handleAuthSuccess(data);
  }, [handleAuthSuccess]);

  /**
   * Registers a new user account.
   * @param {{ firstName: string, lastName: string, email?: string|null, phone?: string|null, password: string }} registerData - registration form data
   * @returns {Promise<{ id: number|string, firstName: string, lastName: string, email: string|null, phone: string|null }>} newly registered user object
   */
  const register = useCallback(async (registerData) => {
    if (!registerData) throw new Error('Registration data is required');
    const res = await api.register(registerData);
    const data = res?.data;
    if (!data) throw new Error('Invalid register response from server');

    incrementSessionGeneration();
    return handleAuthSuccess(data);
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

  const contextValue = useMemo(() => ({
    user,
    loading,
    login,
    register,
    logout,
    refreshProfile
  }), [user, loading, login, register, logout, refreshProfile]);

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
 *   login: (credentials: { credential: string, password: string }) => Promise<{ id: number|string, firstName: string, lastName: string, email: string|null, phone: string|null }>,
 *   register: (registerData: { firstName: string, lastName: string, email?: string|null, phone?: string|null, password: string }) => Promise<{ id: number|string, firstName: string, lastName: string, email: string|null, phone: string|null }>,
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

