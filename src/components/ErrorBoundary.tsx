'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div 
          className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center"
          role="alert"
          aria-live="assertive"
        >
          <div className="text-4xl mb-4">😵</div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-gray-500 mb-4 max-w-md">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={this.handleRetry}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// Functional wrapper for use with hooks
interface ErrorAlertProps {
  error: string | null
  onDismiss: () => void
}

export function ErrorAlert({ error, onDismiss }: ErrorAlertProps) {
  if (!error) return null

  return (
    <div 
      className="mx-4 mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
      role="alert"
      aria-live="polite"
    >
      <span className="text-red-500 text-lg flex-shrink-0">⚠️</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-red-700">{error}</p>
      </div>
      <button
        onClick={onDismiss}
        className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
        aria-label="Dismiss error"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  )
}
