// Conexión con el Apps Script. Todo va por POST con text/plain (sin petición previa CORS)
// y la clave dentro del cuerpo, nunca en la dirección.

export class ErrorClave extends Error {}
export class ErrorRed extends Error {}

const envUrl = import.meta.env.VITE_API_URL as string | undefined;
/** En desarrollo sin VITE_API_URL se usa el simulador del Apps Script. */
export const API_URL = envUrl || (import.meta.env.DEV ? import.meta.env.BASE_URL + 'api-falsa' : '');
export const USA_SIMULADOR = !envUrl && import.meta.env.DEV;

export async function llamar<T = Record<string, unknown>>(clave: string, accion: string, datos?: unknown): Promise<T> {
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
