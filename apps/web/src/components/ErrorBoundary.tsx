import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Catches render-time crashes in any descendant so one broken page doesn't take
 * down the whole app. Shows a friendly fallback with a way back home.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('Uncaught render error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-8 text-center bg-gray-50">
          <div className="max-w-sm">
            <div className="text-5xl mb-4">🏚️</div>
            <h1 className="text-xl font-bold font-display text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-500 mb-5">
              Please refresh the page or head back home — your next place is still out there.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm">
              <button
                onClick={() => window.location.reload()}
                className="bg-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-green-700 transition-colors"
              >
                Refresh
              </button>
              <a href="/" className="text-primary font-medium hover:underline">Go home</a>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
