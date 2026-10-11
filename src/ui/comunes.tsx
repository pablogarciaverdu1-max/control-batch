// Piezas repetidas en varias pantallas.
import type { ReactNode } from 'react';
import { s } from './css';
import { IPapelera } from './iconos';

/** Etiqueta de supermercado con su color. */
export function estiloSuper(sup: string): string {
  return sup === 'Mercadona' ? 'background:#E6F1E9;color:#1D5A31' : sup === 'Aldi' ? 'background:#E4ECFA;color:#1B3A78' : 'background:#ECEDEF;color:#3A4152';
}

/** Hoja que sube desde abajo, sobre un fondo oscuro. Tocar fuera la cierra. */
export function HojaInferior({ etiqueta, rol = 'dialog', onCerrar, alto, children }: {
  etiqueta: string; rol?: 'dialog' | 'alertdialog'; onCerrar: () => void; alto?: string; children: ReactNode;
}) {
  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}
      style={s('position: fixed; inset: 0; z-index: 40; background: rgba(20,33,61,0.55); display: flex; flex-direction: column; justify-content: flex-end; align-items: center')}>
      <div role={rol} aria-modal="true" aria-label={etiqueta}
        style={s('width: 100%; max-width: 720px; background: #FFFFFF; border-radius: 28px 28px 0 0; padding: 24px 20px max(32px, env(safe-area-inset-bottom)); display: flex; flex-direction: column; gap: 16px; box-sizing: border-box; max-height: 92dvh; overflow-y: auto' + (alto ? '; height: ' + alto : ''))}>
        {children}
      </div>
    </div>
  );
}

/** Confirmación de borrado (producto, plato, producción) con su botón rojo. */
export function ConfirmarBorrado({ etiqueta, titulo, boton, onBorrar, onCancelar, children }: {
  etiqueta: string; titulo: string; boton: string; onBorrar: () => void; onCancelar: () => void; children: ReactNode;
}) {
  return (
    <HojaInferior etiqueta={etiqueta} rol="alertdialog" onCerrar={onCancelar}>
      <span style={s('width: 52px; height: 52px; border-radius: 16px; background: #FBE4E1; color: #A1281E; display: flex; align-items: center; justify-content: center; flex-shrink: 0')}>
        <IPapelera t={26} sw={2.2} />
      </span>
      <h2 className="num" style={s('margin: 0; font-size: 24px; font-weight: 800; line-height: 1.15')}>{titulo}</h2>
      {children}
      <div style={s('display: flex; flex-direction: column; gap: 10px; margin-top: 4px')}>
        <button type="button" onClick={onBorrar} style={s('height: 60px; border-radius: 18px; border: none; background: #A1281E; color: #FFFFFF; font-size: 17px; font-weight: 800')}>{boton}</button>
        <button type="button" onClick={onCancelar} style={s('height: 56px; border-radius: 18px; border: 2px solid #DCE2EE; background: #FFFFFF; font-size: 17px; font-weight: 700')}>Cancelar</button>
      </div>
    </HojaInferior>
  );
}

/** Botón cuadrado de volver/cerrar de las cabeceras. */
export const estiloBotonCabecera = 'width: 52px; height: 52px; border-radius: 16px; background: #FFFFFF; display: flex; align-items: center; justify-content: center; flex-shrink: 0';
