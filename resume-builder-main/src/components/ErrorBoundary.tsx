// src/components/ErrorBoundary.tsx
'use client';
import React from 'react';

interface State { hasError: boolean; error: string; }

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode; dark?: boolean }, State> {
  constructor(props: { children: React.ReactNode; dark?: boolean }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    const D = this.props.dark;
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: D ? '#111827' : '#f9fafb', fontFamily: 'Inter, sans-serif', padding: 24,
        }}>
          <div style={{ textAlign: 'center', maxWidth: 400 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: D ? '#f3f4f6' : '#111827', marginBottom: 8 }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: 13, color: D ? '#9ca3af' : '#6b7280', marginBottom: 24, lineHeight: 1.6 }}>
              An unexpected error occurred. Your data is safe — just refresh the page to continue.
            </p>
            <p style={{ fontSize: 11, color: D ? '#6b7280' : '#9ca3af', marginBottom: 20, fontFamily: 'monospace', background: D ? '#1f2937' : '#f3f4f6', padding: '8px 12px', borderRadius: 8 }}>
              {this.state.error}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: '10px 24px', background: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Refresh page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}