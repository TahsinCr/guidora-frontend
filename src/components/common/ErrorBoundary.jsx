import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Guidora ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div style={{
          padding: '40px 24px',
          margin: '24px auto',
          maxWidth: '680px',
          textAlign: 'center',
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          color: '#f87171',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: '#fca5a5' }}>
            {this.props.title || 'Bileşen Yüklenirken Bir Sorun Oluştu'}
          </h2>
          <p style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '16px' }}>
            {this.state.error?.message || 'Beklenmeyen bir arayüz hatası meydana geldi.'}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            style={{
              padding: '8px 18px',
              backgroundColor: '#6366f1',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Yeniden Dene
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
