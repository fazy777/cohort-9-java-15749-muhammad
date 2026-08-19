/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Mail, Phone, User } from 'lucide-react';

/**
 * Modal form component for creating and updating contacts with dynamic email and phone rows.
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   onSave: (payload: Object) => Promise<void>,
 *   contact?: Object | null
 * }} props
 * @returns {JSX.Element|null}
 */
export const ContactFormModal = ({ isOpen, onClose, onSave, contact = null }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [emails, setEmails] = useState([{ email: '', label: 'WORK' }]);
  const [phones, setPhones] = useState([{ phoneNumber: '', label: 'WORK' }]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (contact) {
      setFirstName(contact.firstName || '');
      setLastName(contact.lastName || '');
      setTitle(contact.title || '');
      setNotes(contact.notes || '');
      setEmails(Array.isArray(contact.emails) && contact.emails.length > 0 ? contact.emails : [{ email: '', label: 'WORK' }]);
      setPhones(Array.isArray(contact.phones) && contact.phones.length > 0 ? contact.phones : [{ phoneNumber: '', label: 'WORK' }]);
    } else {
      setFirstName('');
      setLastName('');
      setTitle('');
      setNotes('');
      setEmails([{ email: '', label: 'WORK' }]);
      setPhones([{ phoneNumber: '', label: 'WORK' }]);
    }
  }, [contact, isOpen]);

  if (!isOpen) return null;

  /**
   * Appends a new empty email row.
   */
  const handleAddEmail = () => {
    setEmails((prev) => [...prev, { email: '', label: 'PERSONAL' }]);
  };

  /**
   * Removes an email row at specified index.
   * @param {number} index
   */
  const handleRemoveEmail = (index) => {
    setEmails((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * Updates a specific field on an email row.
   * @param {number} index
   * @param {string} field
   * @param {string} value
   */
  const handleEmailChange = (index, field, value) => {
    setEmails((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  };

  /**
   * Appends a new empty phone row.
   */
  const handleAddPhone = () => {
    setPhones((prev) => [...prev, { phoneNumber: '', label: 'MOBILE' }]);
  };

  /**
   * Removes a phone row at specified index.
   * @param {number} index
   */
  const handleRemovePhone = (index) => {
    setPhones((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * Updates a specific field on a phone row.
   * @param {number} index
   * @param {string} field
   * @param {string} value
   */
  const handlePhoneChange = (index, field, value) => {
    setPhones((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  };

  /**
   * Validates and submits contact form data.
   * @param {import('react').FormEvent} [e]
   */
  const handleSubmit = async (e) => {
    e?.preventDefault();
    setSubmitting(true);

    const filteredEmails = (emails || []).filter((item) => item?.email && item.email.trim() !== '');
    const filteredPhones = (phones || []).filter((item) => item?.phoneNumber && item.phoneNumber.trim() !== '');

    const payload = {
      firstName: firstName?.trim() || '',
      lastName: lastName?.trim() || '',
      title: title?.trim() || '',
      notes: notes?.trim() || '',
      emails: filteredEmails,
      phones: filteredPhones
    };

    try {
      if (typeof onSave === 'function') {
        await onSave(payload);
      }
      if (typeof onClose === 'function') {
        onClose();
      }
    } catch (err) {
      console.error('Failed to submit contact form:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e?.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={22} color="var(--accent-primary)" />
            {contact ? 'Update Contact' : 'Create New Contact'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="contact-first-name">First Name *</label>
              <input
                id="contact-first-name"
                type="text"
                className="input-control"
                placeholder="Jane"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="contact-last-name">Last Name *</label>
              <input
                id="contact-last-name"
                type="text"
                className="input-control"
                placeholder="Smith"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="contact-title">Title / Role</label>
            <input
              id="contact-title"
              type="text"
              className="input-control"
              placeholder="e.g. Software Engineer, Director, Product Manager"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Email Addresses Section */}
          <div style={{ marginTop: '1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Mail size={16} /> Email Addresses
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAddEmail}
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
              >
                <Plus size={14} /> Add Email
              </button>
            </div>

            {(emails || []).map((emailObj, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <label htmlFor={`contact-email-${idx}`} style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}>
                  Email Address {idx + 1}
                </label>
                <input
                  id={`contact-email-${idx}`}
                  type="email"
                  className="input-control"
                  placeholder="name@company.com"
                  value={emailObj?.email || ''}
                  onChange={(e) => handleEmailChange(idx, 'email', e.target.value)}
                  style={{ flex: 1 }}
                />
                <select
                  id={`contact-email-label-${idx}`}
                  aria-label={`Email label for email ${idx + 1}`}
                  className="input-control"
                  value={emailObj?.label || 'WORK'}
                  onChange={(e) => handleEmailChange(idx, 'label', e.target.value)}
                  style={{ width: '130px' }}
                >
                  <option value="WORK">Work</option>
                  <option value="PERSONAL">Personal</option>
                  <option value="OTHER">Other</option>
                </select>
                {emails.length > 1 && (
                  <button
                    type="button"
                    aria-label={`Remove email ${idx + 1}`}
                    onClick={() => handleRemoveEmail(idx)}
                    style={{ background: 'rgba(239, 68, 68, 0.2)', border: 'none', color: '#ef4444', borderRadius: 'var(--radius-sm)', padding: '0 0.6rem', cursor: 'pointer' }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Phone Numbers Section */}
          <div style={{ marginTop: '1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Phone size={16} /> Phone Numbers
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAddPhone}
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
              >
                <Plus size={14} /> Add Phone
              </button>
            </div>

            {(phones || []).map((phoneObj, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <label htmlFor={`contact-phone-${idx}`} style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}>
                  Phone Number {idx + 1}
                </label>
                <input
                  id={`contact-phone-${idx}`}
                  type="tel"
                  className="input-control"
                  placeholder="+1 (555) 000-0000"
                  value={phoneObj?.phoneNumber || ''}
                  onChange={(e) => handlePhoneChange(idx, 'phoneNumber', e.target.value)}
                  style={{ flex: 1 }}
                />
                <select
                  id={`contact-phone-label-${idx}`}
                  aria-label={`Phone label for phone ${idx + 1}`}
                  className="input-control"
                  value={phoneObj?.label || 'WORK'}
                  onChange={(e) => handlePhoneChange(idx, 'label', e.target.value)}
                  style={{ width: '130px' }}
                >
                  <option value="WORK">Work</option>
                  <option value="HOME">Home</option>
                  <option value="PERSONAL">Personal</option>
                  <option value="MOBILE">Mobile</option>
                  <option value="OTHER">Other</option>
                </select>
                {phones.length > 1 && (
                  <button
                    type="button"
                    aria-label={`Remove phone ${idx + 1}`}
                    onClick={() => handleRemovePhone(idx)}
                    style={{ background: 'rgba(239, 68, 68, 0.2)', border: 'none', color: '#ef4444', borderRadius: 'var(--radius-sm)', padding: '0 0.6rem', cursor: 'pointer' }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="form-group">
            <label htmlFor="contact-notes">Notes / Context</label>
            <textarea
              id="contact-notes"
              className="input-control"
              placeholder="Additional information about this contact..."
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
