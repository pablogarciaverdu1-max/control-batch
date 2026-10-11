// Conexión con el Apps Script. Todo va por POST con text/plain (sin petición previa CORS)
// y la clave dentro del cuerpo, nunca en la dirección.

export class ErrorClave extends Error {}
export class ErrorRed extends Error {}

const envUrl = import.meta.env.VITE_API_URL as string | undefined;
/** Versión de prueba: el Apps Script se simula dentro del navegador (datos solo en este dispositivo). */
export const ES_DEMO = import.meta.env.VITE_DEMO === '1';
/** En desarrollo sin VITE_API_URL se usa el simulador del Apps Script. */
export const API_URL = envUrl || (import.meta.env.DEV ? import.meta.env.BASE_URL + 'api-falsa' : '');
export const USA_SIMULADOR = ES_DEMO || (!envUrl && import.meta.env.DEV);

let demo: Promise<{ post: (c: string) => string }> | null = null;
function simuladorDemo() {
  demo ??= (async () => {
    const [{ crearSimuladorDesde }, codigo] = await Promise.all([
      import('../../apps-script/simulador-nucleo'),
      import('../../apps-script/Code.gs?fabrica').then((m) => m.default),
    ]);
    const CLAVE = 'mi-cocina-demo';
    let previo;
    try { previo = JSON.parse(localStorage.getItem(CLAVE) || 'null') ?? undefined; } catch { previo = undefined; }
    return crearSimuladorDesde(codigo, '1234', previo, (e: unknown) => {
      try { localStorage.setItem(CLAVE, JSON.stringify(e)); } catch { /* sin espacio */ }
    });
  })();
  return demo;
}

export async function llamar<T = Record<string, unknown>>(clave: string, accion: string, datos?: unknown): Promise<T> {
  if (ES_DEMO) {
    if (!navigator.onLine) throw new ErrorRed('Sin conexión');
    const sim = await simuladorDemo();
    await new Promise((r) => setTimeout(r, 300));
    const j = JSON.parse(sim.post(JSON.stringify({ clave, accion, datos })));
    if (!j.ok) throw j.error === 'clave' ? new ErrorClave('Clave incorrecta') : new Error(j.mensaje);
    return j as T;
  }
  if (!API_URL) throw new ErrorRed('Falta la dirección del Apps Script (VITE_API_URL).');
  let res: Response;
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ clave, accion, datos }),
      redirect: 'follow',
    });
  } catch {
    throw new ErrorRed('Sin conexión');
  }
  if (!res.ok) throw new ErrorRed('Respuesta ' + res.status);
  let j: { ok: boolean; error?: string; mensaje?: string };
  try {
    j = await res.json();
  } catch {
    throw new ErrorRed('Respuesta no válida');
  }
  if (!j.ok) {
    if (j.error === 'clave') throw new ErrorClave('Clave incorrecta');
    throw new Error(j.mensaje || 'Error del servidor');
  }
  return j as T;
}
