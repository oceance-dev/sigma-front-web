'use client'

import { Component, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props  { children: ReactNode }
interface State  { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  reset = () => this.setState({ error: null })

  render() {
    if (this.state.error) {
      return <ErrorFallback error={this.state.error} onReset={this.reset} />
    }
    return this.props.children
  }
}

function ErrorFallback({ error, onReset }: { error: Error; onReset: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
        <AlertTriangle size={32} className="text-destructive" />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-lg font-semibold text-foreground">Une erreur inattendue est survenue</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          Rechargez la page ou réessayez. Si le problème persiste, contactez le support.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <pre className="mt-2 max-w-lg overflow-auto rounded-lg bg-muted px-4 py-3 text-left text-xs text-muted-foreground">
            {error.message}
          </pre>
        )}
      </div>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Recharger la page
        </Button>
        <Button onClick={onReset}>
          <RefreshCw size={15} className="mr-1.5" /> Réessayer
        </Button>
      </div>
    </div>
  )
}
