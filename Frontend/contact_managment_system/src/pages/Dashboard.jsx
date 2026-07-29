/**
 * @file Dashboard page for contact listing with null checks and exception handling.
 */

import { useEffect, useState, useCallback } from 'react'

/**
 * @typedef {Object} Contact
 * @property {number} id
 * @property {string} firstName
 * @property {string} lastName
 */

export default function Dashboard() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      if (typeof setLoading !== 'function') {
        throw new TypeError('setLoading must be function')
      }
      setLoading(true)
      setError(null)
      // Placeholder for API call with null safety
      const data = []
      if (!Array.isArray(data)) {
        throw new TypeError('Expected array of contacts')
      }
      setContacts(data.filter((c) => c != null))
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional initial load for dashboard
    void load()
  }, [load])

  if (loading) return <p>Loading...</p>
  if (error) return <p role="alert">Error: {error}</p>

  return (
    <section>
      <h2>Dashboard</h2>
      <p>{contacts.length} contacts</p>
    </section>
  )
}
