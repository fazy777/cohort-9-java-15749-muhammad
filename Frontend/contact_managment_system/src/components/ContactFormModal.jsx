/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Mail, Phone, User } from 'lucide-react';
import { useModalA11y } from '../hooks/useModalA11y';

/**
 * Generates a unique stable row ID for dynamic form rows.
 * @returns {string}
 */
const generateRowId = () => Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);

const EMAIL_LABEL_OPTIONS = [
  { value: 'WORK', label: 'Work' },
  { value: 'PERSONAL', label: 'Personal' },
  { value: 'OTHER', label: 'Other' }
];

const PHONE_LABEL_OPTIONS = [
  { value: 'WORK', label: 'Work' },
  { value: 'HOME', label: 'Home' },
  { value: 'PERSONAL', label: 'Personal' },
  { value: 'MOBILE', label: 'Mobile' },
  { value: 'OTHER', label: 'Other' }
];

/**
 * Shared row component for dynamic contact value fields (email, phone).
 *
 * @param {{
 *   fieldName: string,
 *   fieldKey: string,
 *   fieldTitle: string,
 *   inputType: string,
 *   placeholder: string,
 *   rowId: string,
 *   index: number,
 *   value: string,
 *   label: string,
 *   labelOptions: Array<{ value: string, label: string }>,
 *   canRemove: boolean,
 *   onChange: (rowId: string, field: string, value: string) => void,
 *   onRemove: (rowId: string) => void
 * }} props
 */
const ContactValueRow = ({
  fieldName,
  fieldKey,
  fieldTitle,
  inputType,
  placeholder,
  rowId,
  index,
  value,
  label,
  labelOptions,
  canRemove,
  onChange,
  onRemove
}) => (
  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
    <label
      htmlFor={`contact-${fieldName}-${rowId}`}
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0
      }}
    >
      {fieldTitle} {index + 1}
    </label>
    <input
      id={`contact-${fieldName}-${rowId}`}
      type={inputType}
      className="input-control"
      placeholder={placeholder}
      value={value || ''}
      onChange={(e) => onChange(rowId, fieldKey, e.target.value)}
      style={{ flex: 1 }}
    />
    <select
      id={`contact-${fieldName}-label-${rowId}`}
      aria-label={`${fieldName === 'email' ? 'Email' : 'Phone'} label for ${fieldName} ${index + 1}`}
      className="input-control"
      value={label || 'WORK'}
      onChange={(e) => onChange(rowId, 'label', e.target.value)}
      style={{ width: '130px' }}
    >
      {labelOptions.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {canRemove && (
      <button
        type="button"
        aria-label={`Remove ${fieldName} ${index + 1}`}
        onClick={() => onRemove(rowId)}
        style={{
          background: 'rgba(239, 68, 68, 0.2)',
          border: 'none',
          color: '#ef4444',
          borderRadius: 'var(--radius-sm)',
          padding: '0 0.6rem',
          cursor: 'pointer'
        }}
      >
        <Trash2 size={16} />
      </button>
    )}
  </div>
);

/**
 * @typedef {Omit<import('../services/api').ContactDto, 'id' | 'createdAt' | 'updatedAt'>} ContactFormPayload
 */

/**
 * Modal form component for creating and updating contacts with dynamic email and phone rows.
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   onSave: (payload: ContactFormPayload) => Promise<void>,
 *   contact?: import('../services/api').ContactDto | null
 * }} props
 * @returns {JSX.Element|null}
 */
export const ContactFormModal = ({ isOpen, onClose, onSave, contact = null }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [emails, setEmails] = useState(() => [{ rowId: generateRowId(), email: '', label: 'WORK' }]);
  const [phones, setPhones] = useState(() => [{ rowId: generateRowId(), phoneNumber: '', label: 'WORK' }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const modalRef = useModalA11y(isOpen, onClose);

  useEffect(() => {
    if (!isOpen) return;
    setError('');

    if (contact) {
      setFirstName(contact.firstName || '');
      setLastName(contact.lastName || '');
      setTitle(contact.title || '');
      setNotes(contact.notes || '');
      setEmails(
        Array.isArray(contact.emails) && contact.emails.length > 0
          ? contact.emails.map((e) => ({ rowId: generateRowId(), email: e.email || '', label: e.label || 'WORK' }))
          : [{ rowId: generateRowId(), email: '', label: 'WORK' }]
      );
      setPhones(
        Array.isArray(contact.phones) && contact.phones.length > 0
          ? contact.phones.map((p) => ({ rowId: generateRowId(), phoneNumber: p.phoneNumber || '', label: p.label || 'WORK' }))
          : [{ rowId: generateRowId(), phoneNumber: '', label: 'WORK' }]
      );
    } else {
      setFirstName('');
      setLastName('');
      setTitle('');
      setNotes('');
      setEmails([{ rowId: generateRowId(), email: '', label: 'WORK' }]);
      setPhones([{ rowId: generateRowId(), phoneNumber: '', label: 'WORK' }]);
    }
  }, [contact, isOpen]);

  if (!isOpen) return null;

  /**
   * Generic helper to update a specific field on a dynamic row by rowId.
   * @param {React.Dispatch<React.SetStateAction<Array<any>>>} setter
   * @param {string} rowId
   * @param {string} field
   * @param {string} value
   */
  const updateRow = (setter, rowId, field, value) => {
    setter((prev) =>
      prev.map((item) => (item.rowId === rowId ? { ...item, [field]: value } : item))
    );
  };

  /**
   * Appends a new empty email row.
   */
  const handleAddEmail = () => {
    setEmails((prev) => [...prev, { rowId: generateRowId(), email: '', label: 'PERSONAL' }]);
  };

  /**
   * Removes an email row by unique rowId.
   * @param {string} rowId
   */
  const handleRemoveEmail = (rowId) => {
    setEmails((prev) => prev.filter((item) => item.rowId !== rowId));
  };

  /**
   * Updates a specific field on an email row by rowId.
   * @param {string} rowId
   * @param {string} field
   * @param {string} value
   */
  const handleEmailChange = (rowId, field, value) => {
    updateRow(setEmails, rowId, field, value);
  };

  /**
   * Appends a new empty phone row.
   */
  const handleAddPhone = () => {
    setPhones((prev) => [...prev, { rowId: generateRowId(), phoneNumber: '', label: 'MOBILE' }]);
  };

  /**
   * Removes a phone row by unique rowId.
   * @param {string} rowId
   */
  const handleRemovePhone = (rowId) => {
    setPhones((prev) => prev.filter((item) => item.rowId !== rowId));
  };

  /**
   * Updates a specific field on a phone row by rowId.
   * @param {string} rowId
   * @param {string} field
   * @param {string} value
   */
  const handlePhoneChange = (rowId, field, value) => {
    updateRow(setPhones, rowId, field, value);
  };

  /**
   * Validates and submits contact form data.
   * @param {import('react').FormEvent} [e]
   */
  const handleSubmit = async (e) => {
    e?.preventDefault();
    setSubmitting(true);
    setError('');

    const filteredEmails = (emails || [])
      .filter((item) => item?.email && item.email.trim() !== '')
      .map(({ rowId: _rowId, ...rest }) => rest);
    const filteredPhones = (phones || [])
      .filter((item) => item?.phoneNumber && item.phoneNumber.trim() !== '')
      .map(({ rowId: _rowId, ...rest }) => rest);

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
      setError(err?.message || 'Failed to save contact. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
const handleRequestClose = () => {
  if (submitting) return;
  onClose();
};
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-form-modal-title"
        className="modal-container"
        onClick={(e) => e?.stopPropagation()}
        style={{ maxWidth: '640px' }}
      >
        <div className="modal-header">
          <h3 id="contact-form-modal-title" style={{ fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={22} color="var(--accent-primary)" />
            {contact ? 'Update Contact' : 'Create New Contact'}
          </h3>
          <button
            type="button"
            aria-label="Close contact form"
            onClick={onClose}
            disabled={submitting}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div
              role="alert"
              style={{
                background: 'var(--danger-bg)',
                color: 'var(--danger-color)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem',
                fontSize: '0.875rem',
                marginBottom: '1.25rem'
              }}
            >
              {error}
            </div>
          )}

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
              <ContactValueRow
                key={emailObj.rowId}
                rowId={emailObj.rowId}
                index={idx}
                fieldName="email"
                fieldKey="email"
                fieldTitle="Email Address"
                inputType="email"
                placeholder="name@company.com"
                value={emailObj?.email || ''}
                label={emailObj?.label || 'WORK'}
                labelOptions={EMAIL_LABEL_OPTIONS}
                canRemove={emails.length > 1}
                onChange={handleEmailChange}
                onRemove={handleRemoveEmail}
              />
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
              <ContactValueRow
                key={phoneObj.rowId}
                rowId={phoneObj.rowId}
                index={idx}
                fieldName="phone"
                fieldKey="phoneNumber"
                fieldTitle="Phone Number"
                inputType="tel"
                placeholder="+1 (555) 000-0000"
                value={phoneObj?.phoneNumber || ''}
                label={phoneObj?.label || 'WORK'}
                labelOptions={PHONE_LABEL_OPTIONS}
                canRemove={phones.length > 1}
                onChange={handlePhoneChange}
                onRemove={handleRemovePhone}
              />
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
            <button type="button" className="btn btn-secondary" disabled={submitting} onClick={onClose}>
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
