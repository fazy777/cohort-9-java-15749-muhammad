import { User, Mail, Phone, Calendar, Clock, X, Briefcase, FileText } from 'lucide-react';
import { useModalA11y } from '../hooks/useModalA11y';
import { getLabelClass } from '../utils/labels';

/**
 * Encodes an email address for mailto: scheme, preserving valid @ delimiter while encoding other special characters.
 * @param {string} email
 * @returns {string}
 */
const formatMailtoLink = (email) => {
  if (!email) return 'mailto:';
  const trimmed = String(email).trim();
  const atIndex = trimmed.lastIndexOf('@');
  if (atIndex === -1) {
    return `mailto:${encodeURIComponent(trimmed)}`;
  }
  const localPart = trimmed.slice(0, atIndex);
  const domainPart = trimmed.slice(atIndex + 1);
  return `mailto:${encodeURIComponent(localPart)}@${encodeURIComponent(domainPart)}`;
};

/**
 * Encodes a phone number for tel: scheme targets.
 * @param {string} phoneNumber
 * @returns {string}
 */
const formatTelLink = (phone) => {
  if (!phone || typeof phone !== 'string') return '';
  const trimmed = phone.trim();
  if (!trimmed) return '';
  const hasPlus = trimmed.startsWith('+');
  const digits = hasPlus ? trimmed.slice(1) : trimmed;
  return `tel:${hasPlus ? '+' : ''}${encodeURIComponent(digits)}`;
};

/**
 * Modal dialog displaying comprehensive details, timestamps, emails, phones, and actions for a contact.
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   contact: import('../services/api').ContactDto | null,
 *   onEdit: (c: import('../services/api').ContactDto) => void,
 *   onDelete: (contact: import('../services/api').ContactDto) => void
 * }} props
 * @returns {JSX.Element|null}
 */
export const ContactDetailModal = ({ isOpen, onClose, contact, onEdit, onDelete }) => {
  const modalRef = useModalA11y(isOpen, onClose);

  if (!isOpen || !contact) return null;

  /**
   * Formats an ISO date string for display.
   * @param {string} dateString
   * @returns {string}
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) {
        return 'N/A';
      }
      return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  const emails = Array.isArray(contact?.emails) ? contact.emails.filter(Boolean) : [];
  const phones = Array.isArray(contact?.phones) ? contact.phones.filter(Boolean) : [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-detail-modal-title"
        className="modal-container"
        onClick={(e) => e?.stopPropagation()}
        style={{ maxWidth: '560px' }}
      >
        <div className="modal-header">
          <h3 id="contact-detail-modal-title" style={{ fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={22} color="var(--accent-primary)" /> Contact Profile Details
          </h3>
          <button
            type="button"
            aria-label="Close contact details"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Profile Card Summary Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          padding: '1.25rem',
          background: 'rgba(15, 23, 42, 0.5)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '1.5rem',
            fontWeight: '700',
            boxShadow: 'var(--accent-glow)'
          }}>
            {contact?.firstName ? contact.firstName.charAt(0).toUpperCase() : 'C'}
          </div>
          <div>
            <h4 style={{ fontSize: '1.35rem', fontWeight: '700' }}>
              {contact?.firstName} {contact?.lastName}
            </h4>
            {contact?.title && (
              <p style={{ color: 'var(--accent-primary)', fontWeight: '500', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                <Briefcase size={14} /> {contact.title}
              </p>
            )}
          </div>
        </div>

        {/* Emails List */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h5 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Mail size={16} /> Email Addresses ({emails.length})
          </h5>
          {emails.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {emails.map((e, idx) => (
                <div key={e?.id ?? `email-${idx}`} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '0.65rem 0.9rem',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <a href={formatMailtoLink(e?.email)} style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: '500', fontSize: '0.92rem' }}>
                    {e?.email}
                  </a>
                  <span className={`badge ${getLabelClass(e?.label || 'WORK')}`}>{e?.label || 'WORK'}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No email addresses recorded</p>
          )}
        </div>

        {/* Phones List */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h5 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Phone size={16} /> Phone Numbers ({phones.length})
          </h5>
          {phones.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {phones.map((p, idx) => (
                <div key={p?.id ?? `phone-${idx}`} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '0.65rem 0.9rem',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <a href={formatTelLink(p?.phoneNumber)} style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: '500', fontSize: '0.92rem' }}>
                    {p?.phoneNumber}
                  </a>
                  <span className={`badge ${getLabelClass(p?.label || 'WORK')}`}>{p?.label || 'WORK'}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No phone numbers recorded</p>
          )}
        </div>

        {/* Notes */}
        {contact?.notes && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h5 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileText size={16} /> Notes
            </h5>
            <p style={{
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '0.75rem 0.9rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.9rem',
              color: 'var(--text-main)',
              lineHeight: '1.5'
            }}>
              {contact.notes}
            </p>
          </div>
        )}

        {/* Timestamps */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.78rem',
          color: 'var(--text-dim)',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border-color)',
          marginBottom: '1rem'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Calendar size={13} /> Created: {formatDate(contact?.createdAt)}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Clock size={13} /> Updated: {formatDate(contact?.updatedAt)}
          </span>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Close Profile
          </button>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className="btn btn-danger btn-sm" onClick={() => { onClose?.(); onDelete?.(contact); }}>
              Delete Contact
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => { onClose?.(); onEdit?.(contact); }}>
              Update Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
