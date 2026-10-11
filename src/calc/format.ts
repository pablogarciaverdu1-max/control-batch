// Formato español: coma decimal y euro detrás.
import type { Unidad } from '../data/model';

/** Redondeo de céntimos en pantalla: 0,475 → 0,48. */
export function centimos(x: number): number {
  return Math.round(x * 100 + 1e-6) / 100;
}

const fmtEuro = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtNum = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 });

/** 1.1 → "1,10 €" */
export function euros(x: number): string {
  return fmtEuro.format(centimos(x) + 0) + ' €';
}

/** 1.1 → "1,10" (sin símbolo) */
export function eurosSinSimbolo(x: number): string {
  return fmtEuro.format(centimos(x) + 0);
}

/** 0.5 → "0,5"; 6.8 → "6,8"; 300 → "300" (hasta 2 decimales). */
export function numero(x: number): string {
  return fmtNum.format(Math.round(x * 100) / 100 + 0);
}

/** Cantidad con su unidad: "300 g", "0,5 envase", "2 envases", "1 ud". */
export function cantidad(q: number, unidad: Unidad): string {
  if (unidad === 'envase') return numero(q) + (q > 1 ? ' envases' : ' envase');
  return numero(q) + ' ' + unidad;
}

/** Contenido del envase como en Compras: "570 g", "1 envase", "5 ud". */
export function contenido(c: number, unidad: Unidad): string {
  return cantidad(c, unidad);
}

/**
 * Precio por unidad para mostrar: €/kg para g, €/l para ml, €/ud y €/envase.
 * `abreviado` usa "/env." como en el formulario de producto.
 */
export function precioPorUnidad(precioEnvase: number, cont: number, unidad: Unidad, abreviado = false): string {
  const ppu = precioEnvase / cont;
  if (unidad === 'g') return euros(ppu * 1000) + '/kg';
  if (unidad === 'ml') return euros(ppu * 1000) + '/l';
  if (unidad === 'ud') return euros(ppu) + '/ud';
  return euros(ppu) + (abreviado ? '/env.' : '/envase');
}

/**
 * Lee un número escrito a mano. Acepta coma y punto: "0,60", "0.60", "1.234,5".
 * Devuelve null si no es un número.
 */
export function leerNumero(texto: string): number | null {
  let t = String(texto).trim().replace(/\s|€/g, '');
  if (!t) return null;
  if (t.includes(',') && t.includes('.')) t = t.replace(/\./g, '').replace(',', '.');
  else t = t.replace(',', '.');
  if (!/^-?\d*\.?\d+$|^-?\d+\.$/.test(t)) return null;
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : null;
}

/** "1 plato", "3 platos", "ningún plato" */
export function platos(n: number): string {
  if (n === 0) return 'ningún plato';
  return n === 1 ? '1 plato' : n + ' platos';
}

/** "6,8 raciones", "1 ración" */
export function raciones(n: number): string {
  return numero(n) + (Math.abs(n - 1) < 1e-9 ? ' ración' : ' raciones');
}

/** Valor del redondeo como texto: 0.1 → "0,10" */
export function redondeoTexto(r: number): string {
  return eurosSinSimbolo(r);
}

/** "los 10 céntimos", "los 5 céntimos", "los 50 céntimos" */
export function redondeoFrase(r: number): string {
  return 'los ' + Math.round(r * 100) + ' céntimos';
}
