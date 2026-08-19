import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { User, Mail, Phone, LogOut, KeyRound, X, RotateCcw } from 'lucide-react';

/**
 * User profile modal dialog displaying account metadata and providing a password change form.
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   showToast?: (msg: string, type: string) => void
 * }} props
 * @returns {JSX.Element|null}
 */
export const UserProfileModal = ({ isOpen, onClose, showToast }) => {
  const { user, logout } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !user) return null;

  /**
   * Resets password change input fields.
   */
  const handleResetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  /**
   * Submits password change request, logs user out, and informs user upon success.
   * @param {import('react').FormEvent} [e]
   */
  const handleChangePassword = async (e) => {
    e?.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast?.('New passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast?.('Password must be at least 6 characters long', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      showToast?.('Password changed successfully! Please sign in again with your new password.', 'success');
      handleResetPasswordForm();
      setShowPasswordModal(false);
      onClose?.();
      logout?.();
    } catch (err) {
      showToast?.(err?.message || 'Failed to change password', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e?.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={22} color="var(--accent-primary)" /> User Profile
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {!showPasswordModal ? (
          <div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '1rem',
              marginBottom: '1.5rem',
              background: 'rgba(15, 23, 42, 0.4)',
              borderRadius: 'var(--radius-lg)'
            }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'var(--accent-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '1.8rem',
                fontWeight: '700',
                marginBottom: '0.75rem',
                boxShadow: 'var(--accent-glow)'
              }}>
                {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
              </div>
              <h4 style={{ fontSize: '1.3rem', fontWeight: '700' }}>
                {user?.firstName} {user?.lastName}
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Account Owner</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)' }}>
                <Mail size={18} color="var(--accent-primary)" />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email Address</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '500' }}>{user?.email || 'Not provided'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)' }}>
                <Phone size={18} color="var(--accent-primary)" />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Phone Number</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '500' }}>{user?.phone || 'Not provided'}</div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => { onClose?.(); logout?.(); }}
              >
                <LogOut size={16} /> Logout
              </button>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowPasswordModal(true)}
                >
                  <KeyRound size={16} /> Change Password
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Modal 4: Change Password Modal */
          <form onSubmit={handleChangePassword}>
            <div style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Update your account password below.
            </div>

            <div className="form-group">
              <label htmlFor="current-password">Current Password *</label>
              <input
                id="current-password"
                type="password"
                className="input-control"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="new-password">New Password *</label>
              <input
                id="new-password"
                type="password"
                className="input-control"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password">Confirm New Password *</label>
              <input
                id="confirm-password"
                type="password"
                className="input-control"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleResetPasswordForm}
                title="Reset Form"
              >
                <RotateCcw size={14} /> Reset
              </button>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={submitting}
                >
                  {submitting ? 'Updating...' : 'Reset Password'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
