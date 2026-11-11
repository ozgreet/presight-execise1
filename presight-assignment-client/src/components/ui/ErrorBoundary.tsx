import { Component, type ErrorInfo, type ReactNode } from 'react'
import { PageError } from './PageError'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled application error:', error, info)
  }

  private handleRetry = () => {
    this.setState({ hasError: false })
    window.location.assign(window.location.pathname)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="canvas" data-theme="dark">
          <div className="app">
            <PageError
              title="Unexpected error"
              message="The application ran into a problem. Reload the page to continue."
              onRetry={this.handleRetry}
              retryLabel="Reload page"
            />
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
