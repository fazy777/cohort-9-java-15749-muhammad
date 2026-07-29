/**
 * @file Entry point for the Contact Management System React frontend application.
 * Mounts the root App component into the DOM under StrictMode with robust error handling.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

/**
 * Error boundary class to catch rendering errors.
 */
class ErrorBoundary {
  static logError(error, info) {
    console.error('React rendering error:', error, info)
  }
}

/**
 * Initializes and renders the React application into the root DOM element
 * with null checks and exception handling (HIGH priority fix).
 *
 * @returns {void}
 * @throws {Error} If root element is not found
 */
function renderApp() {
  try {
    const rootElement = document.getElementById('root')

    // HIGH: Null check for root element
    if (rootElement == null) {
      throw new Error('Root element #root not found in DOM. Ensure index.html contains <div id="root"></div>')
    }

    // Additional safety: check if createRoot is available
    if (typeof createRoot !== 'function') {
      throw new TypeError('createRoot is not a function - ReactDOM may not be properly installed')
    }

    if (App == null) {
      throw new Error('App component is null or undefined')
    }

    const root = createRoot(rootElement)

    if (root == null) {
      throw new Error('Failed to create React root')
    }

    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    )

    console.info('Contact Management System frontend mounted successfully')
  } catch (error) {
    // Log error with context
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during app initialization'
    console.error('Failed to render application:', errorMessage, error)
    ErrorBoundary.logError(error, { component: 'renderApp' })

    // Attempt to show user-friendly message in DOM if possible
    try {
      const fallbackElement = document.getElementById('root') ?? document.body
      if (fallbackElement) {
        fallbackElement.innerHTML = `
          <div style="padding:20px;font-family:sans-serif;text-align:center;">
            <h1>Application Failed to Load</h1>
            <p>${errorMessage}</p>
            <p>Please refresh the page or contact support if the problem persists.</p>
          </div>
        `
      }
    } catch (fallbackError) {
      console.error('Failed to render fallback UI:', fallbackError)
    }

    // Re-throw for monitoring tools
    throw error
  }
}

// Execute with global error handling
try {
  renderApp()
} catch (e) {
  // Top-level catch prevents silent failures
  console.error('Critical failure in main.jsx:', e)
}
