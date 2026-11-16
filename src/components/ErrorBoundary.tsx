import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected rendering error occurred.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Application ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#FAF8F4] text-[#111111]">
          <div className="max-w-lg w-full bg-white border border-[#E7E3DA] shadow-lg rounded-3xl p-8 text-center space-y-5">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
              <AlertTriangle size={26} />
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#6BAA00] font-bold block mb-1">
                Recovery Mode
              </span>
              <h1 className="font-display text-3xl text-[#111111]">
                Something tripped on this view.
              </h1>
              <p className="text-sm text-[#5B5B56] mt-2">
                {this.state.errorMessage}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#B6F500] text-[#111111] text-xs font-semibold hover:opacity-90 transition cursor-pointer shadow-xs"
              >
                <RotateCcw size={14} /> Reload Page
              </button>
              <a
                href="/"
                onClick={() => this.setState({ hasError: false, errorMessage: '' })}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FAF8F4] border border-[#E7E3DA] text-xs font-semibold text-[#111111] hover:bg-white transition"
              >
                <Home size={14} /> Return Home
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
