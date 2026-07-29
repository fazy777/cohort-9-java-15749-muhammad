/**
 * Root component for the Contact Management System Frontend interface.
 * Implements null safety, error handling, and proper component structure.
 *
 * @returns {JSX.Element} The rendered React component layout.
 */
import { useState, useEffect, useCallback } from 'react'
import './App.css'

/**
 * @typedef {Object} Contact
 * @property {number} id
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} [title]
 */

const initialContacts = [
  { id: 1, firstName: 'John', lastName: 'Doe', title: 'Software Engineer' },
]

function App() {
  const [contacts, setContacts] = useState(initialContacts)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  /**
   * Handles fetching contacts with exception handling and null checks.
   */
  const fetchContacts = useCallback(async () => {
    try {
      if (typeof setLoading !== 'function' || typeof setError !== 'function') {
        throw new Error('State setters must be functions')
      }
      setLoading(true)
      setError(null)

      // Simulated API call with null safety
      // In production, replace with: await contactService.getAllContacts()
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Validate data integrity
      if (!Array.isArray(initialContacts)) {
        throw new TypeError('Contacts data must be an array')
      }

      const validContacts = initialContacts.filter(
        (contact) => contact != null && contact.id != null && contact.firstName && contact.lastName
      )

      setContacts(validContacts)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch contacts'
      console.error('Error fetching contacts:', err)
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional initial data load
    void fetchContacts()
  }, [fetchContacts])

  /**
   * Handles search input change with null validation.
   * @param {React.ChangeEvent<HTMLInputElement>} event
   */
  const handleSearchChange = (event) => {
    try {
      if (!event || !event.target) {
        throw new Error('Event or target is null')
      }
      const value = event.target.value ?? ''
      setSearchTerm(value)
    } catch (err) {
      console.error('Search handling error:', err)
      setError('Search failed')
    }
  }

  const filteredContacts = (() => {
    try {
      if (!Array.isArray(contacts)) {
        return []
      }
      if (searchTerm == null || searchTerm.trim() === '') {
        return contacts
      }
      const term = searchTerm.toLowerCase()
      return contacts.filter((contact) => {
        if (contact == null) return false
        const first = contact.firstName?.toLowerCase() ?? ''
        const last = contact.lastName?.toLowerCase() ?? ''
        return first.includes(term) || last.includes(term)
      })
    } catch {
      return []
    }
  })()

  if (loading) {
    return (
      <main className="app-container">
        <p>Loading contacts...</p>
      </main>
    )
  }

  return (
    <main className="app-container">
      <header>
        <h1>Contact Management System</h1>
        <p>Securely manage your contacts</p>
      </header>

      {error && (
        <div role="alert" className="error-banner">
          <p>Error: {error}</p>
          <button type="button" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      <section>
        <div className="search-bar">
          <label htmlFor="search">Search contacts</label>
          <input
            id="search"
            type="text"
            placeholder="Search by first or last name..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        <h2>Contacts ({filteredContacts.length})</h2>

        {filteredContacts.length === 0 ? (
          <p>No contacts found. Try adjusting your search or add a new contact.</p>
        ) : (
          <ul className="contact-list">
            {filteredContacts.map((contact) => {
              if (contact == null || contact.id == null) {
                return null
              }
              return (
                <li key={contact.id} className="contact-card">
                  <h3>
                    {contact.firstName} {contact.lastName}
                  </h3>
                  {contact.title && <p>{contact.title}</p>}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </main>
  )
}

export default App
