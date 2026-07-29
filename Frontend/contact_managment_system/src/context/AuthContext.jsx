/**
 * @file Authentication Context for CMS with null safety and proper OOP.
 */
/* eslint-disable react-refresh/only-export-components -- AuthProvider component + useAuth hook needed for context pattern */

import { createContext, useContext, useState, useMemo, useCallback } from 'react'

/**
 * @typedef {Object} User
 * @property {number} id
 * @property {string} email
 * @property {string} firstName
 */

/**
 * @typedef {Object} AuthContextValue
 * @property {User|null} user
 * @property {boolean} isAuthenticated
 * @property {function} login
 * @property {function} logout
 */

const AuthContext = createContext(
  /** @type {AuthContextValue|null} */ (null)
)

/**
 * Provides authentication state with exception handling.
 * @param {{children: import('react').ReactNode}} props
 */
export function AuthProvider({ children }) {
  if (children == null) {
    throw new Error('AuthProvider children must not be null')
  }

  const [user, setUser] = useState(
    /** @type {User|null} */ (null)
  )

  const login = useCallback(
    /**
     * @param {User} userData
     */
    (userData) => {
      try {
        if (userData == null) {
          throw new Error('userData must not be null')
        }
        if (userData.email == null || userData.id == null) {
          throw new Error('Invalid user data: missing required fields')
        }
        setUser(userData)
        console.info('User logged in:', userData.email)
      } catch (error) {
        console.error('Login failed:', error)
        throw error
      }
    },
    []
  )

  const logout = useCallback(() => {
    try {
      setUser(null)
      console.info('User logged out')
    } catch (error) {
      console.error('Logout error:', error)
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user != null,
      login,
      logout,
    }),
    [user, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook to use AuthContext with null check (HIGH priority fix).
 * @returns {AuthContextValue}
 */
export function useAuth() {
  try {
    const context = useContext(AuthContext)
    if (context == null) {
      throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
  } catch (error) {
    console.error('useAuth error:', error)
    throw error
  }
}

export default AuthContext
