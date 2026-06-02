import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

// Catches render-time crashes anywhere below it so a single bad render shows a friendly
// "tap to reload" card instead of blanking the whole app to a white screen.
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Surface to the console for debugging; a real logger would go here in production.
    console.error('Uncaught UI error:', error, info.componentStack)
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#fdf6e3] p-6 text-center">
        <div className="text-6xl">🐲💤</div>
        <h1 className="text-xl font-extrabold text-slate-800">Sunny tripped!</h1>
        <p className="max-w-xs text-sm text-slate-500">
          Something went wrong while drawing the screen. A quick reload usually fixes it.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-2xl bg-orange-500 px-6 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-orange-600 active:scale-95"
        >
          Reload 🔄
        </button>
      </div>
    )
  }
}
