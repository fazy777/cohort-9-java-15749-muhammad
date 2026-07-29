/**
 * @file Error Boundary component for catching rendering errors.
 * Implements proper OOP with class component.
 */

import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    if (props == null) {
      throw new Error('ErrorBoundary props must not be null')
    }
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    // Null check for error
    if (error == null) {
      return { hasError: true, error: new Error('Unknown error') }
    }
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    try {
      if (error != null) {
        console.error('ErrorBoundary caught error:', error, errorInfo)
      }
    } catch (e) {
      console.error('Error in componentDidCatch:', e)
    }
  }

  handleReset = () => {
    try {
      this.setState({ hasError: false, error: null })
    } catch (error) {
      console.error('Failed to reset error boundary:', error)
    }
  }

  render() {
    try {
      if (this.state.hasError) {
        const message = this.state.error?.message ?? 'An unexpected error occurred'
        return (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <h2>Something went wrong</h2>
            <p>{message}</p>
            <button type="button" onClick={this.handleReset}>
              Try again
            </button>
          </div>
        )
      }

      if (this.props.children == null) {
        throw new Error('ErrorBoundary children is null')
      }

      return this.props.children
    } catch (error) {
      console.error('ErrorBoundary render failed:', error)
      return <div>Critical rendering error. Please refresh.</div>
    }
  }
}

export default ErrorBoundary
