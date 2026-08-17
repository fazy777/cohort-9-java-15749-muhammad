import { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

export const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, contact }) => {
  const [deleting, setDeleting] = useState(false);

  if (!isOpen || !contact) return null;

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      if (typeof onConfirm === 'function' && contact.id != null) {
        await onConfirm(contact.id);
      }
      if (typeof onClose === 'function') {
        onClose();
      }
    } catch (err) {
      console.error('Delete contact failed:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e?.stopPropagation()} style={{ maxWidth: '440px', textAlign: 'center' }}>
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

        <h3 style={{ fontSize: '1.35rem', fontWeight: '700', marginBottom: '0.5rem' }}>
          Delete Contact?
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
          Are you sure you want to delete <strong style={{ color: 'var(--text-main)' }}>{contact.firstName} {contact.lastName}</strong>? This action cannot be undone.
        </p>

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
