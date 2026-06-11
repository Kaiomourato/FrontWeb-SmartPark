import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Erro não tratado:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', textAlign: 'center',
          background: 'var(--bg-base)', color: 'var(--text-primary)', padding: 24,
        }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>Ops, algo deu errado</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            Ocorreu um erro inesperado. Tente recarregar a página.
          </p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
