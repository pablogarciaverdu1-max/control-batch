import type { CSSProperties, ReactNode } from 'react';

/**
 * Botón "Otra" fecha: encima lleva un selector de fecha transparente,
 * así al tocarlo se abre el calendario del móvil o del ordenador.
 */
export function BotonFecha({ fecha, onFecha, style, pressed, children }: {
  fecha: string; onFecha: (f: string) => void; style: CSSProperties; pressed: boolean; children: ReactNode;
}) {
  return (
    <span style={{ ...style, position: 'relative' }} role="button" aria-pressed={pressed}>
      {children}
      <input type="date" aria-label="Elegir día" value={fecha}
        onChange={(e) => { if (e.target.value) onFecha(e.target.value); }}
        onClick={(e) => { try { (e.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.(); } catch { /* sin selector */ } }}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', border: 'none', padding: 0, margin: 0, boxSizing: 'border-box' }} />
    </span>
  );
}
