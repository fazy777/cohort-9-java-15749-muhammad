import { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useModalA11y } from '../hooks/useModalA11y';

/**
 * Confirmation dialog for permanently deleting a contact.
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   onConfirm: (id: number|string) => Promise<void>|void,
 *   contact: { id: number|string, firstName?: string, lastName?: string } | null
 * }} props
 * @returns {JSX.Element|null}
 */
export const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, contact }) => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const modalRef = useModalA11y(isOpen, onClose);

  if (!isOpen || !contact) return null;

  /**
   * Executes deletion and invokes callback upon completion.
   */
  const handleConfirm = async () => {
    setDeleting(true);
    setError('');
    try {
      if (typeof onConfirm === 'function' && contact.id != null) {
        await onConfirm(contact.id);
      }
      if (typeof onClose === 'function') {
        onClose();
      }
    } catch (err) {
      console.error('Delete contact failed:', err);
      setError(err?.message || 'Failed to delete contact. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-confirm-modal-title"
        className="modal-container"
        onClick={(e) => e?.stopPropagation()}
        style={{ maxWidth: '440px', textAlign: 'center' }}
      >
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.15)',
          color: 'var(--danger-color)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem'
        }}>
          <AlertTriangle size={28} />
        </div>

        <h3 id="delete-confirm-modal-title" style={{ fontSize: '1.35rem', fontWeight: '700', marginBottom: '0.5rem' }}>
          Delete Contact?
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
          Are you sure you want to delete <strong style={{ color: 'var(--text-main)' }}>{contact.firstName} {contact.lastName}</strong>? This action cannot be undone.
        </p>

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
              marginBottom: '1.25rem',
              textAlign: 'center'
            }}
          >
            {error}
          </div>
        )}

        <div className="modal-footer" style={{ justifyContent: 'center', margin: 0, border: 'none', paddingTop: 0 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={deleting}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={handleConfirm} disabled={deleting}>
            {deleting ? 'Deleting...' : (
              <>
                <Trash2 size={16} /> Confirm Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
