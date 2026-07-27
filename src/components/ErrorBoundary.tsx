import { Component, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('Application error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center text-foreground">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/15 text-destructive">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-bold">Something went wrong</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            {this.state.error?.message ?? 'An unexpected error occurred while loading the page.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <RefreshCw className="h-4 w-4" /> Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
