// Marco común: menú inferior en móvil y menú lateral azul en ordenador.
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { s } from './css';
import { ICarrito, ICasa, IOlla, IReloj, ISol } from './iconos';

export type Seccion = 'inicio' | 'compras' | 'platos' | 'historial' | 'ajustes';

const RUTAS: Record<Seccion, string> = { inicio: '/', compras: '/compras', platos: '/platos', historial: '/historial', ajustes: '/ajustes' };

export function useEsOrdenador(): boolean {
  const q = '(min-width: 900px)';
  const [v, setV] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const f = () => setV(m.matches);
    m.addEventListener('change', f);
    return () => m.removeEventListener('change', f);
  }, []);
  return v;
}

const itemNav = 'display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px 0; min-height: 56px; box-sizing: border-box; font-size: 13px;';

export function MenuInferior({ actual }: { actual?: Seccion }) {
  const item = (sec: Seccion, nombre: string, icono: (on: boolean) => ReactNode) => {
    const on = actual === sec;
    return (
      <Link to={RUTAS[sec]} aria-current={on ? 'page' : undefined}
        style={s(itemNav + (on ? 'color: #14213D; font-weight: 700' : 'color: #4A5672; font-weight: 600'))}>
        <span style={s(on ? 'background: #FF9F1C; border-radius: 14px; padding: 4px 16px; display: flex' : 'padding: 4px 16px; display: flex')}>{icono(on)}</span>
        {nombre}
      </Link>
    );
  };
  return (
    <nav aria-label="Navegación principal" style={s('display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); background: #FFFFFF; border-top: 1px solid #DCE2EE; padding: 8px 8px max(22px, env(safe-area-inset-bottom)); flex-shrink: 0')}>
      {item('inicio', 'Inicio', () => <ICasa />)}
      {item('compras', 'Compras', (on) => <ICarrito sw={on ? 2.2 : 2} />)}
      {item('platos', 'Platos', (on) => <IOlla sw={on ? 2.2 : 2} />)}
      {item('historial', 'Historial', (on) => <IReloj sw={on ? 2.2 : 2} />)}
    </nav>
  );
}

export function MenuLateral({ actual }: { actual?: Seccion }) {
  const item = (sec: Seccion, nombre: string, icono: (on: boolean) => ReactNode) => {
    const on = actual === sec;
    return (
      <Link to={RUTAS[sec]} aria-current={on ? 'page' : undefined}
        style={s('display: flex; align-items: center; gap: 12px; height: 52px; padding: 0 14px; border-radius: 14px; font-size: 16px; ' +
          (on ? 'background: rgba(255,159,28,0.16); color: #FFFFFF; font-weight: 700' : 'color: #C9D1E4; font-weight: 600'))}>
        {icono(on)}{nombre}
      </Link>
    );
  };
  const c = (on: boolean) => (on ? '#FF9F1C' : 'currentColor');
  return (
    <aside style={s('flex: 0 0 240px; background: #14213D; color: #FFFFFF; padding: 28px 20px; display: flex; flex-direction: column; gap: 28px; box-sizing: border-box; min-height: 100dvh; position: sticky; top: 0; align-self: flex-start; height: 100dvh')}>
      <div style={s('display: flex; align-items: center; gap: 12px')}>
        <span style={s('width: 44px; height: 44px; border-radius: 14px; background: #FF9F1C; display: flex; align-items: center; justify-content: center')}>
          <IOlla sw={2.2} c="#14213D" />
        </span>
        <span className="num" style={s('font-size: 22px; font-weight: 800')}>Mi cocina</span>
      </div>
      <nav aria-label="Navegación principal" style={s('display: flex; flex-direction: column; gap: 4px')}>
        {item('inicio', 'Inicio', (on) => <ICasa t={22} c={c(on)} />)}
        {item('compras', 'Compras', (on) => <ICarrito t={22} c={c(on)} />)}
        {item('platos', 'Platos', (on) => <IOlla t={22} c={c(on)} />)}
        {item('historial', 'Historial', (on) => <IReloj t={22} c={c(on)} />)}
        {item('ajustes', 'Ajustes', (on) => <ISol t={22} c={c(on)} />)}
      </nav>
    </aside>
  );
}

/**
 * Pantalla de móvil: columna a toda altura con el menú inferior.
 * En ordenador (sin diseño propio) va en una columna centrada de 720 px con el menú lateral.
 */
export function Pantalla({ seccion, conMenu = true, fondo = '#EEF1F8', children }: { seccion?: Seccion; conMenu?: boolean; fondo?: string; children: ReactNode }) {
  const ord = useEsOrdenador();
  const columna = (
    <div style={s(`height: 100dvh; background: ${fondo}; display: flex; flex-direction: column; overflow: hidden; position: relative; font-family: 'Figtree', system-ui, sans-serif; color: #14213D;` +
      (ord ? ' flex: 1; max-width: 720px; margin: 0 auto; width: 100%' : ''))}>
      {children}
      {conMenu && !ord && <MenuInferior actual={seccion} />}
    </div>
  );
  if (!ord) return columna;
  return (
    <div style={s('display: flex; min-height: 100dvh; background: #EEF1F8')}>
      <MenuLateral actual={seccion} />
      <div style={s('flex: 1; min-width: 0; display: flex')}>{columna}</div>
    </div>
  );
}
