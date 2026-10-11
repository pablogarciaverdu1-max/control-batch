// Simulador del Apps Script para tests y para `npm run dev` sin Google (Node).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { crearSimuladorDesde, type Simulador } from './simulador-nucleo';

export type { Simulador };

export function crearSimulador(clave: string | null = '1234'): Simulador {
  const ruta = fileURLToPath(new URL('./Code.gs', import.meta.url));
  return crearSimuladorDesde(readFileSync(ruta, 'utf8'), clave);
}
