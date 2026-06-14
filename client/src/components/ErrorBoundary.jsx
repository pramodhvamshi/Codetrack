import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#0B1020',
          color: '#fff',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: '500px',
            background: 'rgba(17, 24, 39, 0.75)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)'
          }}>
            <h1 style={{ color: '#ef4444', marginTop: 0, fontSize: '1.8rem' }}>Something went wrong</h1>
            <p style={{ color: '#9ca3af', fontSize: '0.95rem', margin: '1rem 0 1.5rem' }}>
              An unexpected error occurred while rendering this page.
            </p>
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '1rem',
              borderRadius: '0.5rem',
              textAlign: 'left',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              overflowX: 'auto',
              color: '#f87171',
              marginBottom: '1.5rem',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              {this.state.error?.toString()}
            </div>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              style={{
                background: 'radial-gradient(circle at top, #3B82F6, #0ea5e9)',
                border: 'none',
                borderRadius: '999px',
                padding: '0.6rem 1.5rem',
                color: '#0b1120',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(56, 189, 248, 0.35)',
                transition: 'transform 0.15s'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
