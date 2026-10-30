import React from 'react';

class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Code Vibe UI error:', error, info);
  }

  handleReload = () => window.location.reload();

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-6 text-center">
        <div className="max-w-md rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
          <p className="mt-3 text-gray-500">Your account is safe. Please try again.</p>
          <button onClick={this.handleReload} className="btn-primary mt-6 px-5 py-2.5">Try again</button>
        </div>
      </main>
    );
  }
}

export default ErrorBoundary;
