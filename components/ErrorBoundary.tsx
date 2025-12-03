import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4 font-sans">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-2xl max-w-md w-full border border-red-100 dark:border-red-900 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-400">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Une erreur est survenue</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
              L'application a rencontré un problème inattendu. Cela peut être dû à des données corrompues.
            </p>
            
            {this.state.error && (
                <div className="bg-gray-100 dark:bg-slate-950 p-3 rounded text-left text-xs text-red-500 font-mono mb-6 overflow-auto max-h-32 border border-gray-200 dark:border-slate-700">
                    {this.state.error.message}
                </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-600/20"
            >
              <RefreshCw size={18} />
              Réinitialiser l'application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;