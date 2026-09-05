/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { safeStorage } from '../utils/storage';
import { User, Mail, Phone, LogOut, KeyRound, X, RotateCcw } from 'lucide-react';
import { useModalA11y } from '../hooks/useModalA11y';

/**
 * User profile modal dialog displaying account metadata and providing a password change form.
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   showToast?: (msg: string, type: string) => void,
 *   onAccountClosed?: (reason?: string) => Promise<void> | void
 * }} props
 * @returns {JSX.Element|null}
 */
export const UserProfileModal = ({ isOpen, onClose, showToast, onAccountClosed }) => {
  const { user, logout, updateUser, refreshProfile } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [phoneSubmitting, setPhoneSubmitting] = useState(false);
  const currentPasswordRef = useRef(null);
  const changePasswordBtnRef = useRef(null);
  const prevShowPasswordRef = useRef(showPasswordModal);

  /**
   * Guards modal dismissal while a password update operation is in progress.
   */
  const handleModalClose = () => {
    if (submitting || phoneSubmitting) return;
    onClose?.();
  };

  const modalRef = useModalA11y(isOpen, handleModalClose);

  useEffect(() => {
    if (prevShowPasswordRef.current !== showPasswordModal) {
      if (showPasswordModal) {
        currentPasswordRef.current?.focus();
      } else {
        changePasswordBtnRef.current?.focus();
      }
      prevShowPasswordRef.current = showPasswordModal;
    }
  }, [showPasswordModal]);

  useEffect(() => {
    if (!isOpen || !user) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordModal(false);
      setIsEditingPhone(false);
      setNewPhone('');
    }
  }, [isOpen, user]);

  /**
   * Submits phone number update to the API.
   * @param {import('react').FormEvent} [e]
   */
  const handleSavePhone = async (e) => {
    e?.preventDefault();
    if (!newPhone || !newPhone.trim()) {
      showToast?.('Please enter a valid phone number', 'error');
      return;
    }
    const trimmed = newPhone.trim();
    if (trimmed.length < 7 || trimmed.length > 30) {
      showToast?.('Phone number must be between 7 and 30 characters', 'error');
      return;
    }

    const submittingUserId = user?.id;
    setPhoneSubmitting(true);
    try {
      const updatedProfile = await api.updatePhone({ phone: trimmed });
      updateUser?.({ phone: updatedProfile?.phone || trimmed }, submittingUserId);
      await refreshProfile?.();
      showToast?.('Phone number added to account successfully!', 'success');
      setIsEditingPhone(false);
    } catch (err) {
      if (err?.accountClosed) {
        setIsEditingPhone(false);
        if (typeof onAccountClosed === 'function') {
          await onAccountClosed(err?.message);
        } else {
          safeStorage.setItem(
            'cms_account_closed_notice',
            'Your account was permanently closed due to repeated duplicate phone number policy violations.'
          );
          onClose?.();
          try {
            await logout?.();
          } catch {
            // ignore
          }
          showToast?.('Account permanently closed due to policy violations.', 'error');
        }
        return;
      }
      showToast?.(err?.message || 'Failed to update phone number', 'error');
    } finally {
      setPhoneSubmitting(false);
    }
  };

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
   * Handles user logout, guards against concurrent submissions, and informs user upon error.
   */
  const handleLogout = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await logout?.();
      onClose?.();
    } catch (err) {
      showToast?.(err?.message || 'Failed to logout', 'error');
    } finally {
      setSubmitting(false);
    }
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
    if (!newPassword || newPassword.length < 6) {
      showToast?.('Password must be at least 6 characters long', 'error');
      return;
    }

    const currentPasswordBytes = new TextEncoder().encode(currentPassword || '').length;
    if (currentPasswordBytes > 72) {
      showToast?.('Current password cannot exceed 72 bytes', 'error');
      return;
    }

    const newPasswordBytes = new TextEncoder().encode(newPassword).length;
    if (newPasswordBytes > 72) {
      showToast?.('Password cannot exceed 72 bytes', 'error');
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
    <div className="modal-overlay" onClick={handleModalClose}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-profile-modal-title"
        className="modal-container"
        onClick={(e) => e?.stopPropagation()}
        style={{ maxWidth: '520px' }}
      >
        <div className="modal-header">
          <h3 id="user-profile-modal-title" style={{ fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={22} color="var(--accent-primary)" /> User Profile
          </h3>
          <button
            type="button"
            aria-label="Close profile"
            onClick={handleModalClose}
            disabled={submitting}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: submitting ? 'not-allowed' : 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {!showPasswordModal ? (
          <div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)'
            }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'var(--accent-gradient)',
                border: '2px solid rgba(255, 255, 255, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '1.8rem',
                fontWeight: '800',
                marginBottom: '0.75rem',
                boxShadow: '0 0 20px rgba(185, 28, 28, 0.6), 0 0 10px rgba(255, 255, 255, 0.3)'
              }}>
                {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
              </div>
              <h4 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#ffffff' }}>
                {user?.firstName} {user?.lastName}
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Account Owner</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid var(--border-color)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)' }}>
                <Mail size={18} color="#ffffff" />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email Address</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '500', color: '#ffffff' }}>{user?.email || 'Not provided'}</div>
                </div>
              </div>

              {isEditingPhone ? (
                <form
                  onSubmit={handleSavePhone}
                  style={{
                    background: 'linear-gradient(135deg, rgba(185, 28, 28, 0.22) 0%, rgba(255, 255, 255, 0.05) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <label
                    htmlFor="user-profile-phone-input"
                    style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
                  >
                    <Phone size={15} color="#ffffff" />
                    {user?.phone ? 'Update Account Phone Number' : 'Add Phone Number to Account'}
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      id="user-profile-phone-input"
                      type="tel"
                      className="input-control"
                      placeholder="+1 (555) 000-0000"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      aria-label={user?.phone ? 'Update Account Phone Number' : 'Add Phone Number to Account'}
                      required
                      autoFocus
                      disabled={phoneSubmitting}
                      style={{ flex: 1, padding: '0.4rem 0.65rem', fontSize: '0.9rem' }}
                    />
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      disabled={phoneSubmitting}
                      style={{ padding: '0.4rem 0.85rem', whiteSpace: 'nowrap' }}
                    >
                      {phoneSubmitting ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={phoneSubmitting}
                      onClick={() => setIsEditingPhone(false)}
                      style={{ padding: '0.4rem 0.65rem' }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border-color)',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Phone size={18} color="#ffffff" />
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Phone Number</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: '500', color: user?.phone ? 'var(--text-main)' : 'var(--text-muted)', fontStyle: user?.phone ? 'normal' : 'italic' }}>
                        {user?.phone || 'Not provided'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setNewPhone(user?.phone || '');
                      setIsEditingPhone(true);
                    }}
                    style={{ fontSize: '0.8rem', padding: '0.25rem 0.65rem' }}
                  >
                    {user?.phone ? 'Edit' : '+ Add Phone'}
                  </button>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={handleLogout}
                disabled={submitting}
              >
                <LogOut size={16} /> Logout
              </button>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  ref={changePasswordBtnRef}
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
                ref={currentPasswordRef}
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
                disabled={submitting}
                title="Reset Form"
              >
                <RotateCcw size={14} /> Reset
              </button>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    if (submitting) return;
                    handleResetPasswordForm();
                    setShowPasswordModal(false);
                  }}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={submitting}
                >
                  {submitting ? 'Updating...' : 'Change Password'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
