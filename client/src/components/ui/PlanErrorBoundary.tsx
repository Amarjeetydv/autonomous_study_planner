import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, LayoutDashboard, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  showRawError: boolean;
}

export class PlanErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    showRawError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, showRawError: false };
  }

  public componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {
    // Log error for diagnostics
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, showRawError: false });
    if (this.props.onRetry) {
      this.props.onRetry();
    } else {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full glass-panel p-8 rounded-2xl border border-slate-800 text-center space-y-6 shadow-2xl">
            <div className="h-16 w-16 rounded-2xl bg-red-950/80 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
              <AlertTriangle className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-white">We couldn't display your study plan.</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                An unexpected issue occurred while rendering the curriculum layout. Your goal remains intact.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-3 px-4 text-xs font-bold transition shadow-lg shadow-brand-500/20"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>

              <button
                onClick={() => (window.location.href = '/dashboard')}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl py-3 px-4 text-xs font-bold transition"
              >
                <LayoutDashboard className="h-4 w-4" />
                Back to Dashboard
              </button>
            </div>

            <div className="pt-2 border-t border-slate-900">
              <button
                onClick={() => this.setState((prev) => ({ showRawError: !prev.showRawError }))}
                className="text-[10px] text-slate-500 hover:text-slate-300 font-semibold flex items-center justify-center gap-1 mx-auto"
              >
                <Bug className="h-3 w-3" />
                {this.state.showRawError ? 'Hide Raw Error' : 'View Raw Error'}
              </button>
              {this.state.showRawError && (
                <pre className="mt-3 p-3 bg-slate-900 text-red-400 text-[10px] font-mono rounded-xl text-left overflow-x-auto border border-slate-800 max-h-40">
                  {this.state.error?.stack || this.state.error?.message || 'Unknown Error'}
                </pre>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default PlanErrorBoundary;
