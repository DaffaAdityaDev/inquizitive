import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <div className="text-center space-y-4 max-w-md p-8 rounded-2xl bg-content1 border border-divider shadow-xl">
            <div className="w-12 h-12 mx-auto rounded-full bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center text-danger-500 font-bold text-xl">
              !
            </div>
            <h1 className="text-2xl font-bold text-default-900">Something went wrong</h1>
            <p className="text-default-500 text-sm">An unexpected error occurred. You can safely reload the page to continue.</p>
            <button
              className="px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-md shadow-primary/20"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
