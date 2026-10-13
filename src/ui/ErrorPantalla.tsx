import { Component, type ReactNode } from 'react';

/** Si algo falla al pintar una pantalla, enseña el error en vez de dejarla en blanco. */
export class ErrorPantalla extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ minHeight: '100dvh', background: '#14213D', color: '#FFFFFF', padding: '48px 24px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 16, fontFamily: "'Figtree', system-ui, sans-serif" }}>
        <h1 className="num" style={{ margin: 0, fontSize: 30, fontWeight: 800 }}>Algo ha fallado</h1>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.45, color: '#C9D1E4' }}>Tus datos están a salvo. Recarga la app; si vuelve a pasar, envía este mensaje:</p>
        <code style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 12, fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{String(this.state.error?.message || this.state.error)}</code>
        <button type="button" onClick={() => location.reload()} style={{ height: 60, border: 'none', borderRadius: 18, background: '#FF9F1C', color: '#14213D', fontSize: 18, fontWeight: 800 }}>Recargar</button>
      </div>
    );
  }
}
