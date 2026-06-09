import React, { Component } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught a crash:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden text-slate-100">
          {/* Background ambient glowing spheres */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-rose-500/10 blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl"></div>

          <div className="w-full max-w-md z-10 text-center space-y-6">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-rose-500/25 mb-6">
                <ShieldAlert className="w-9 h-9 text-white animate-pulse" />
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">Portal Crash Detected</h2>
              <p className="text-sm text-slate-400 mt-2 font-medium">An unexpected error has crashed this React view.</p>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-6 rounded-2xl text-left font-mono text-xs text-rose-450 overflow-x-auto max-h-40 divide-y divide-slate-800">
              <div className="pb-2 font-bold uppercase tracking-wider text-[10px] text-slate-500">Error Stack Trace</div>
              <div className="pt-2 whitespace-pre-wrap">{this.state.error?.toString()}</div>
            </div>

            <button
              onClick={this.handleReload}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-400 hover:to-indigo-500 text-white font-semibold text-sm shadow-md shadow-rose-500/15 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Application Portal
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
