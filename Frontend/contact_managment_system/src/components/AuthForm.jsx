import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Phone, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';

/**
 * Authentication form component handling user login and account registration with email/phone toggle.
 *
 * @param {{ showToast?: (msg: string, type: string) => void }} props
 * @returns {JSX.Element}
 */
export const AuthForm = ({ showToast }) => {
  const { login, register } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields
  const [regType, setRegType] = useState('email'); // 'email' or 'phone'
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loginCredential, setLoginCredential] = useState('');

  /**
   * Handles submission of login or registration form.
   * @param {import('react').FormEvent} [e]
   */
  const handleSubmit = async (e) => {
    e?.preventDefault();
    setLoading(true);

    try {
      if (isLoginMode) {
        if (!loginCredential || !password) {
          throw new Error('Please fill in all login fields');
        }
        await login({ credential: loginCredential.trim(), password });
        showToast?.('Successfully logged in!', 'success');
      } else {
        if (!firstName || !lastName || !password) {
          throw new Error('Please fill in all required fields');
        }

        if (regType === 'email' && !email) {
          throw new Error('Please enter a valid email address');
        }
        if (regType === 'phone' && !phone) {
          throw new Error('Please enter a valid phone number');
        }

        await register({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: regType === 'email' ? email.trim() : null,
          phone: regType === 'phone' ? phone.trim() : null,
          password
        });
        showToast?.('Account created successfully!', 'success');
      }
    } catch (err) {
      showToast?.(err?.message || 'Authentication error', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '480px',
      margin: '3rem auto',
      width: '100%'
    }}>
      <div className="glass-card" style={{ padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '20px',
            background: 'var(--accent-gradient)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            boxShadow: 'var(--accent-glow)'
          }}>
            <ShieldCheck size={32} color="#fff" />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            {isLoginMode ? 'Welcome Back' : 'Create Your Account'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {isLoginMode
              ? 'Access your unified contact dashboard'
              : 'Register using your Email or Phone Number'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLoginMode && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="auth-first-name">First Name *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="auth-first-name"
                      type="text"
                      className="input-control"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="auth-last-name">Last Name *</label>
                  <input
                    id="auth-last-name"
                    type="text"
                    className="input-control"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Toggle Register By Email or Phone */}
              <div className="form-group">
                <label>Register With</label>
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  background: 'rgba(15, 23, 42, 0.5)',
                  padding: '4px',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <button
                    type="button"
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: regType === 'email' ? 'var(--accent-primary)' : 'transparent',
                      color: '#fff',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem'
                    }}
                    onClick={() => setRegType('email')}
                  >
                    <Mail size={16} /> Email
                  </button>
                  <button
                    type="button"
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: regType === 'phone' ? 'var(--accent-primary)' : 'transparent',
                      color: '#fff',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem'
                    }}
                    onClick={() => setRegType('phone')}
                  >
                    <Phone size={16} /> Phone Number
                  </button>
                </div>
              </div>

              {regType === 'email' ? (
                <div className="form-group">
                  <label htmlFor="auth-register-email">Email Address *</label>
                  <input
                    id="auth-register-email"
                    type="email"
                    className="input-control"
                    placeholder="john.doe@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label htmlFor="auth-register-phone">Phone Number *</label>
                  <input
                    id="auth-register-phone"
                    type="tel"
                    className="input-control"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              )}
            </>
          )}

          {isLoginMode && (
            <div className="form-group">
              <label htmlFor="auth-login-credential">Email or Phone Number *</label>
              <input
                id="auth-login-credential"
                type="text"
                className="input-control"
                placeholder="john.doe@example.com or +123456789"
                value={loginCredential}
                onChange={(e) => setLoginCredential(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-password">Password *</label>
            <div style={{ position: 'relative' }}>
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                className="input-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '1rem', padding: '0.85rem' }}
          >
            {loading ? (
              <span>Processing...</span>
            ) : (
              <>
                <span>{isLoginMode ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: '1.75rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--border-color)',
          fontSize: '0.9rem',
          color: 'var(--text-muted)'
        }}>
          {isLoginMode ? "Don't have an account?" : 'Already registered?'}{' '}
          <button
            type="button"
            onClick={() => setIsLoginMode(!isLoginMode)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-primary)',
              fontWeight: '600',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isLoginMode ? 'Register Now' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};
