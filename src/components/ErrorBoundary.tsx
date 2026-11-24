import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let readable = error.message || 'An unexpected error occurred.';
    try {
      const parsed = JSON.parse(readable);
      if (parsed && parsed.error) {
        readable = `Access or sync error (${parsed.operationType} on ${parsed.path}): ${parsed.error}`;
      }
    } catch {
      // plain string error
    }
    return { hasError: true, message: readable };
  }

  componentDidCatch(error: Error) {
    console.error('Deboo.pk ErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center px-6">
          <div className="max-w-md w-full bg-white border border-[#E8DCC3] p-8 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-[#9D7B38] mb-3">
              Deboo.pk Atelier
            </p>
            <h1 className="font-serif text-3xl text-[#222222] mb-3">
              Something needs your attention
            </h1>
            <p className="text-sm text-[#777777] mb-6 leading-relaxed">{this.state.message}</p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, message: '' });
                window.location.href = '/';
              }}
              className="px-6 py-2.5 bg-[#222222] text-white text-xs uppercase tracking-[0.16em] hover:bg-[#3A3A3A] transition-colors"
            >
              Return Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
