/**
 * @file Entry point for the Contact Management System React frontend application.
 * Mounts the root App component into the DOM under StrictMode with null safety.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

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

    const root = createRoot(rootElement)
    if (root && typeof root.render === 'function') {
      root.render(
        <StrictMode>
          <App />
        </StrictMode>,
      )
    }
  } catch (error) {
    console.error('Fatal error during React application startup:', error)
  }
}

renderApp()
