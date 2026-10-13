import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

/**
 * Browser extensions (password managers, translators, ad blockers, etc.)
 * sometimes mutate the DOM directly, outside React's control. When that
 * collides with React's own commit, insertBefore/removeChild throws a
 * NotFoundError — the app's data and component state are completely
 * unaffected, only that one DOM node was moved or removed by something
 * else. Surfacing that as "Something went wrong" reads as an app bug to
 * whoever hits it and isn't actionable for them, so it's recovered from
 * silently instead of shown: React always unmounts the failed subtree
 * before getDerivedStateFromError runs, so clearing hasError here just
 * remounts fresh on the very next render — invisible in practice, since
 * TanStack Query's cache and the router's URL live outside this tree and
 * are untouched by the remount.
 */
const BENIGN_EXTENSION_DOM_ERROR = /insertBefore|removeChild/i

// Caps how many times this recovers silently within RESET_WINDOW_MS. If
// something keeps re-triggering it that fast, it's more likely a genuine
// render bug than a one-off extension collision — fall back to the visible
// crash screen rather than looping invisibly.
const MAX_SILENT_RECOVERIES = 3
const RESET_WINDOW_MS = 5000

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  private recoveryTimestamps: number[] = []

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (error.name === 'NotFoundError' && BENIGN_EXTENSION_DOM_ERROR.test(error.message)) {
      const now = Date.now()
      this.recoveryTimestamps = [...this.recoveryTimestamps, now].filter((t) => now - t < RESET_WINDOW_MS)

      if (this.recoveryTimestamps.length <= MAX_SILENT_RECOVERIES) {
        console.warn('Recovered from a likely browser-extension DOM conflict:', error, info.componentStack)
        this.setState({ hasError: false })
        return
      }
    }

    console.error('Unhandled render error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
          <div>
            <h1 className="font-heading text-xl font-semibold">Something went wrong</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              This page hit an unexpected error. Reloading usually fixes it.
            </p>
          </div>
          <Button type="button" onClick={() => window.location.reload()}>
            Reload page
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
