/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { safeStorage, cleanupLegacyStorage } from '../utils/storage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => safeStorage.getItem('cms_token'));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    safeStorage.removeItem('cms_token');
    safeStorage.removeItem('cms_user');
    cleanupLegacyStorage();
  }, []);

  useEffect(() => {
    cleanupLegacyStorage();

    const initAuth = async () => {
      try {
        const savedToken = safeStorage.getItem('cms_token');
        const savedUser = safeStorage.getItem('cms_user');

        if (savedToken) {
          setToken(savedToken);
          if (savedUser) {
            try {
              setUser(JSON.parse(savedUser));
            } catch {
              // ignore parse errors
            }
          }
          try {
            // Validate and refresh user profile from backend
            const freshUser = await api.getProfile();
            if (freshUser) {
              setUser(freshUser);
              safeStorage.setItem('cms_user', JSON.stringify(freshUser));
            }
          } catch (err) {
            console.warn('Session token validation failed:', err);
            logout();
          }
        }
      } catch (err) {
        console.error('Failed to initialize authentication:', err);
      } finally {
        setLoading(false);
      }
    };

    void initAuth();
  }, [logout]);

  const login = async (credentials) => {
    if (!credentials) throw new Error('Credentials are required');
    const res = await api.login(credentials);
    const data = res?.data;
    if (!data) throw new Error('Invalid login response from server');

    const userObj = {
      id: data.id,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone
    };

    setToken(data.token);
    setUser(userObj);
    safeStorage.setItem('cms_token', data.token);
    safeStorage.setItem('cms_user', JSON.stringify(userObj));
    cleanupLegacyStorage();
    return userObj;
  };

  const register = async (registerData) => {
    if (!registerData) throw new Error('Registration data is required');
    const res = await api.register(registerData);
    const data = res?.data;
    if (!data) throw new Error('Invalid register response from server');

    const userObj = {
      id: data.id,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone
    };

    setToken(data.token);
    setUser(userObj);
    safeStorage.setItem('cms_token', data.token);
    safeStorage.setItem('cms_user', JSON.stringify(userObj));
    cleanupLegacyStorage();
    return userObj;
  };

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    try {
      const profile = await api.getProfile();
      if (profile) {
        setUser(profile);
        safeStorage.setItem('cms_user', JSON.stringify(profile));
      }
    } catch (err) {
      console.warn('Failed to refresh user profile:', err);
    }
  }, [token]);

  const contextValue = useMemo(() => ({
    user,
    token,
    loading,
    login,
    register,
    logout,
    refreshProfile
  }), [user, token, loading, logout, refreshProfile]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

