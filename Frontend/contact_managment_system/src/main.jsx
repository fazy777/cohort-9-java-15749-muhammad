/**
 * @file Entry point for the Contact Management System React frontend application.
 * Mounts the root App component into the DOM under StrictMode with null safety.
 */

import { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

/**
 * Top-level application ErrorBoundary to catch rendering crashes and present fallback UI.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error caught by root ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          background: '#0f172a',
          color: '#f8fafc'
        }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '700' }}>Something went wrong</h1>
          <p style={{ color: '#94a3b8', marginBottom: '1.5rem', maxWidth: '400px', lineHeight: '1.5' }}>
            An unexpected error occurred in the application. Please reload the page to restore state.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => window.location.reload()}
            style={{ padding: '0.6rem 1.4rem' }}
          >
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Initializes and renders the React application into the root DOM element.
 *
 * @returns {void}
 */
function renderApp() {
  try {
    const rootElement = document.getElementById('root')
    if (!rootElement) {
      console.error('Failed to locate #root element in document')
      return
    }

    const root = createRoot(rootElement, {
      onCaughtError: (error, errorInfo) => {
        console.error('Root onCaughtError:', error, errorInfo);
      },
      onUncaughtError: (error, errorInfo) => {
        console.error('Root onUncaughtError:', error, errorInfo);
      },
      onRecoverableError: (error, errorInfo) => {
        console.error('Root onRecoverableError:', error, errorInfo);
      }
    });

    if (root && typeof root.render === 'function') {
      root.render(
        <StrictMode>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </StrictMode>,
      )
    }
  } catch (error) {
    console.error('Fatal error during React application startup:', error)
  }
}

renderApp()
