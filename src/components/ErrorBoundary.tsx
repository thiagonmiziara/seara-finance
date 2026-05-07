import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  info: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): State {
    return { error, info: null };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error);
    console.error('[ErrorBoundary] component stack', info.componentStack);
    this.setState({ error, info });
  }

  handleReset = () => {
    this.setState({ error: null, info: null });
  };

  render() {
    if (this.state.error) {
      const { error, info } = this.state;
      return (
        <div
          style={{
            minHeight: '100vh',
            padding: '24px',
            background: '#0e1622',
            color: '#fef3c7',
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: '13px',
            overflow: 'auto',
          }}
        >
          <div
            style={{
              maxWidth: 980,
              margin: '0 auto',
              border: '1px solid #b91c1c',
              borderRadius: 12,
              padding: '20px 24px',
              background: 'rgba(127, 29, 29, 0.15)',
            }}
          >
            <h1
              style={{
                margin: 0,
                marginBottom: 16,
                color: '#fca5a5',
                fontSize: 20,
                fontWeight: 800,
              }}
            >
              💥 Algo quebrou no front
            </h1>
            <div style={{ marginBottom: 12, color: '#fda4af' }}>
              <strong>{error.name}:</strong> {error.message}
            </div>
            <details open style={{ marginBottom: 12 }}>
              <summary style={{ cursor: 'pointer', color: '#fbbf24' }}>
                stack trace
              </summary>
              <pre
                style={{
                  whiteSpace: 'pre-wrap',
                  marginTop: 8,
                  background: '#0a0f1a',
                  padding: 12,
                  borderRadius: 8,
                  border: '1px solid #1e293b',
                  color: '#e5e7eb',
                  fontSize: 12,
                  lineHeight: 1.5,
                }}
              >
                {error.stack ?? '(sem stack)'}
              </pre>
            </details>
            {info?.componentStack && (
              <details>
                <summary style={{ cursor: 'pointer', color: '#fbbf24' }}>
                  component stack
                </summary>
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    marginTop: 8,
                    background: '#0a0f1a',
                    padding: 12,
                    borderRadius: 8,
                    border: '1px solid #1e293b',
                    color: '#e5e7eb',
                    fontSize: 12,
                    lineHeight: 1.5,
                  }}
                >
                  {info.componentStack}
                </pre>
              </details>
            )}
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button
                type='button'
                onClick={this.handleReset}
                style={{
                  background: '#22c55e',
                  color: '#0a0f1a',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: 8,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Tentar novamente
              </button>
              <button
                type='button'
                onClick={() => location.reload()}
                style={{
                  background: '#1f2937',
                  color: '#e5e7eb',
                  border: '1px solid #374151',
                  padding: '8px 14px',
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Recarregar página
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
