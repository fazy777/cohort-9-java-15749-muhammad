import { useAuth } from '../context/AuthContext';
import { LogOut, BookOpen } from 'lucide-react';

/**
 * Navigation bar component rendering brand logo, user profile avatar trigger, and logout action.
 *
 * @param {{ onOpenProfile?: () => void }} props
 * @returns {JSX.Element}
 */
export const Navbar = ({ onOpenProfile }) => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="nav-brand">
          <BookOpen size={28} style={{ color: '#ffffff', filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))' }} />
          <span>ContactSphere</span>
        </div>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              type="button"
              className="user-badge"
              onClick={onOpenProfile}
              title="View Profile & Settings"
              aria-label="View Profile and Settings"
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--accent-gradient)',
                border: '1.5px solid rgba(255, 255, 255, 0.6)',
                boxShadow: '0 0 8px rgba(255, 255, 255, 0.3), 0 2px 8px rgba(185, 28, 28, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '0.9rem'
              }}>
                {user.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
              </div>
              <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#ffffff' }}>
                {user.firstName} {user.lastName}
              </span>
            </button>

            <button
              className="btn btn-secondary btn-sm"
              onClick={logout}
              title="Logout"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};
