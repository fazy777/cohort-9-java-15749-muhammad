/**
 * @file Entry point for the Contact Management System React frontend application.
 * Mounts the root App component into the DOM under StrictMode.
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
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

renderApp()


