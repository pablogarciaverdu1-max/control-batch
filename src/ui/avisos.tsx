// Avisos de abajo: confirmación tras guardar (4 s) y "Deshacer" tras borrar (6 s).
// Es un único aviso: uno nuevo sustituye al anterior y confirma el borrado pendiente.
import { useEffect, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';
import { almacen } from '../data/almacen';
import type { Cambios, Datos } from '../data/operaciones';
import { s } from './css';
import { ICheck, IDeshacer, IPapelera } from './iconos';
import { useEsOrdenador } from './marco';

type Aviso =
  | { id: number; tipo: 'ok'; msg: string; sub?: string }
  | { id: number; tipo: 'deshacer'; msg: string; cambios: Cambios; originales: Cambios };

let actual: Aviso | null = null;
let temporizador: ReturnType<typeof setTimeout> | undefined;
let contador = 0;
const oyentes = new Set<() => void>();
const avisar = () => oyentes.forEach((f) => f());

function poner(a: Aviso | null, ms?: number) {
  clearTimeout(temporizador);
  const anterior = actual;
  actual = a;
  // Un aviso nuevo confirma el borrado pendiente del anterior
  if (anterior?.tipo === 'deshacer' && anterior.id !== a?.id) almacen.confirmar(anterior.cambios);
  if (a && ms) temporizador = setTimeout(() => { if (actual?.id === a.id) poner(null); }, ms);
  avisar();
}

export function avisoOk(msg: string, sub?: string) {
  poner({ id: ++contador, tipo: 'ok', msg, sub }, 4000);
}

/** Registros de `antes` que van a cambiar con `cambios`, tal como están ahora. */
function originalesDe(antes: Datos, c: Cambios): Cambios {
  const o = <T extends { id: string }>(lista: T[], cambiados?: T[]) =>
    cambiados?.map((x) => lista.find((y) => y.id === x.id)).filter((x): x is T => !!x);
  return { productos: o(antes.productos, c.productos), precios: o(antes.precios, c.precios), platos: o(antes.platos, c.platos), producciones: o(antes.producciones, c.producciones) };
}

/** Borrado diferido: se oculta al momento y se envía cuando el aviso desaparece. */
export async function borrarConDeshacer(msg: string, cambios: Cambios) {
  const originales = originalesDe(almacen.get().todo, cambios);
  if (actual?.tipo === 'deshacer') { const a = actual; actual = null; await almacen.confirmar(a.cambios); }
  await almacen.enPantalla(cambios);
  poner({ id: ++contador, tipo: 'deshacer', msg, cambios, originales }, 6000);
}

function deshacer() {
  if (actual?.tipo !== 'deshacer') return;
  const a = actual;
  actual = null;
  clearTimeout(temporizador);
  almacen.restaurar(a.originales);
  avisar();
}

const RUTAS_CON_MENU = ['/', '/compras', '/platos', '/historial'];

export function Avisos() {
  const a = useSyncExternalStore((f) => { oyentes.add(f); return () => oyentes.delete(f); }, () => actual);
  const { pathname } = useLocation();
  const ord = useEsOrdenador();
  useEffect(() => () => clearTimeout(temporizador), []);
  if (!a) return null;
  const abajo = ord ? 24 : RUTAS_CON_MENU.includes(pathname) ? 100 : 108;
  const pos = `position: fixed; z-index: 50; bottom: calc(${abajo}px + env(safe-area-inset-bottom)); ` +
    (ord ? 'left: 50%; transform: translateX(-50%); width: 420px; max-width: calc(100% - 32px);' : 'left: 16px; right: 16px;');
  if (a.tipo === 'ok') {
    return (
      <div key={a.id} role="status" style={s(pos + 'background: #14213D; color: #FFFFFF; border-radius: 18px; padding: 14px 16px; display: flex; align-items: center; gap: 12px; box-shadow: 0 12px 30px rgba(20,33,61,0.30); box-sizing: border-box')}>
        <span style={s('width: 30px; height: 30px; border-radius: 50%; background: #2E8B57; display: flex; align-items: center; justify-content: center; flex-shrink: 0')}>
          <ICheck t={18} sw={3} c="#FFFFFF" />
        </span>
        <span style={s('display: flex; flex-direction: column; gap: 2px; min-width: 0')}>
          <span style={s('font-size: 15px; font-weight: 700')}>{a.msg}</span>
          {a.sub && <span style={s('font-size: 14px; font-weight: 500; color: #C9D1E4')}>{a.sub}</span>}
        </span>
      </div>
    );
  }
  return (
    <div key={a.id} role="status" style={s(pos + 'overflow: hidden; background: #14213D; color: #FFFFFF; border-radius: 18px; padding: 10px 10px 14px 18px; display: flex; align-items: center; gap: 12px; box-shadow: 0 12px 30px rgba(20,33,61,0.30); box-sizing: border-box')}>
      <IPapelera t={22} c="#C9D1E4" style={s('flex-shrink: 0')} />
      <span style={s('flex: 1; font-size: 15px; font-weight: 700')}>{a.msg}</span>
      <button type="button" onClick={deshacer} style={s('height: 44px; padding: 0 16px; border: none; border-radius: 12px; background: #FF9F1C; color: #14213D; font-size: 15px; font-weight: 800; display: flex; align-items: center; gap: 6px')}>
        <IDeshacer t={18} />
        Deshacer
      </button>
      <span aria-hidden="true" className="barra-aviso" style={s('position: absolute; left: 0; bottom: 0; height: 4px; width: 100%; background: #FF9F1C; transform-origin: left')} />
    </div>
  );
}
