/**
 * @file ContactForm with validation, null checks, exception handling.
 */

import { useState, useCallback } from 'react'

/**
 * @param {{onSubmit?: (data:any)=>void, initialData?: any}} props
 */
export default function ContactForm({ onSubmit, initialData }) {
  const [formData, setFormData] = useState({
    firstName: initialData?.firstName ?? '',
    lastName: initialData?.lastName ?? '',
    title: initialData?.title ?? '',
    email: initialData?.email ?? '',
    phone: initialData?.phone ?? '',
  })
  const [error, setError] = useState(null)

  const handleChange = useCallback((e) => {
    try {
      if (e == null || e.target == null) {
        throw new Error('Event target is null')
      }
      const { name, value } = e.target
      if (name == null) {
        throw new Error('Input name is null')
      }
      setFormData((prev) => {
        if (prev == null) return { [name]: value }
        return { ...prev, [name]: value ?? '' }
      })
    } catch (err) {
      console.error('handleChange error:', err)
      setError(err instanceof Error ? err.message : 'Input error')
    }
  }, [])

  const handleSubmit = useCallback(
    async (e) => {
      try {
        if (e && typeof e.preventDefault === 'function') {
          e.preventDefault()
        }
        setError(null)

        if (formData == null) {
          throw new Error('formData is null')
        }
        if (!formData.firstName?.trim() || !formData.lastName?.trim()) {
          throw new Error('First and last name are required')
        }

        if (typeof onSubmit === 'function') {
          await onSubmit(formData)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Submit failed'
        setError(msg)
      }
    },
    [formData, onSubmit]
  )

  return (
    <form onSubmit={handleSubmit} noValidate>
      {error && <p role="alert">{error}</p>}
      <input name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First Name" required />
      <input name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last Name" required />
      <input name="title" value={formData.title} onChange={handleChange} placeholder="Title" />
      <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email" />
      <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" />
      <button type="submit">Save</button>
    </form>
  )
}
