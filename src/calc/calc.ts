// Reglas de cálculo. Todo en euros, sin redondear hasta mostrarlo,
// salvo el precio a cobrar, que se redondea al alza.
import type { Plato, Precio, Producto, Produccion, IngredienteProduccion } from '../data/model';
import { centimos } from './format';

/** Precio por unidad = precio del envase / contenido. */
export function precioUnitario(precioEnvase: number, contenido: number): number {
  return contenido > 0 ? precioEnvase / contenido : 0;
}

/** Coste de un ingrediente = cantidad × precio por unidad. */
export function costeIngrediente(cantidad: number, ppu: number): number {
  return cantidad * ppu;
}

/** Precio a cobrar: coste por ración redondeado al alza al múltiplo de `r`. */
export function precioACobrar(costeRacion: number, r: number): number {
  return centimos(Math.ceil(costeRacion / r - 1e-9) * r);
}

export interface Lote {
  costeLote: number;
  raciones: number;
  costeRacion: number;
  /** null si se cuenta en raciones. */
  costeUnidad: number | null;
  precioCobrar: number;
}

/**
 * Calcula un lote a partir de sus ingredientes (cantidad y precio por unidad),
 * cuántas salen y cuántas van por ración.
 */
export function calcularLote(
  items: { cantidad: number; precioUnitario: number }[],
  salen: number,
  porRacion: number,
  enRaciones: boolean,
  redondeo: number,
): Lote {
  const costeLote = items.reduce((a, it) => a + costeIngrediente(it.cantidad, it.precioUnitario), 0);
  const per = enRaciones ? 1 : porRacion;
  const raciones = per > 0 ? salen / per : 0;
  const costeRacion = raciones > 0 ? costeLote / raciones : 0;
  const costeUnidad = enRaciones ? null : salen > 0 ? costeLote / salen : 0;
  return { costeLote, raciones, costeRacion, costeUnidad, precioCobrar: precioACobrar(costeRacion, redondeo) };
}

/** Ordena el historial de un producto: el más reciente primero (por fecha y, si empatan, por creación). */
export function ordenarPrecios(precios: Precio[]): Precio[] {
  return precios.slice().sort((a, b) => (a.fecha === b.fecha ? b.creadoEn - a.creadoEn : a.fecha < b.fecha ? 1 : -1));
}

/** Índice productoId → precio actual del envase (entrada más reciente). */
export function preciosActuales(precios: Precio[]): Map<string, number> {
  const m = new Map<string, Precio>();
  for (const p of precios) {
    if (p.borrado) continue;
    const cur = m.get(p.productoId);
    if (!cur || p.fecha > cur.fecha || (p.fecha === cur.fecha && p.creadoEn > cur.creadoEn)) m.set(p.productoId, p);
  }
  return new Map([...m].map(([k, v]) => [k, v.precio]));
}

export interface Catalogo {
  productos: Map<string, Producto>;
  precio: Map<string, number>;
}

export function crearCatalogo(productos: Producto[], precios: Precio[]): Catalogo {
  return {
    productos: new Map(productos.filter((p) => !p.borrado).map((p) => [p.id, p])),
    precio: preciosActuales(precios),
  };
}

/** Precio por unidad actual de un producto (0 si no existe o no tiene precio). */
export function ppuActual(cat: Catalogo, productoId: string): number {
  const p = cat.productos.get(productoId);
  if (!p) return 0;
  return precioUnitario(cat.precio.get(productoId) ?? 0, p.contenido);
}

/** Coste de un plato con los precios actuales. Los ingredientes de productos borrados no cuentan. */
export function costePlato(plato: Plato, cat: Catalogo, redondeo: number): Lote {
  const items = plato.ingredientes
    .filter((i) => cat.productos.has(i.productoId))
    .map((i) => ({ cantidad: i.cantidad, precioUnitario: ppuActual(cat, i.productoId) }));
  return calcularLote(items, plato.salen, plato.porRacion, plato.cuenta === 'raciones', redondeo);
}

/** Platos (no borrados) que llevan un producto. */
export function platosQueUsan(productoId: string, platos: Plato[]): Plato[] {
  return platos.filter((p) => !p.borrado && p.ingredientes.some((i) => i.productoId === productoId));
}

/** Coste que aporta un producto a un plato con su precio actual. */
export function costeDeProductoEnPlato(productoId: string, plato: Plato, cat: Catalogo): number {
  return plato.ingredientes
    .filter((i) => i.productoId === productoId)
    .reduce((a, i) => a + costeIngrediente(i.cantidad, ppuActual(cat, productoId)), 0);
}

/** Ingrediente de producción con la "foto" del producto y su precio de ese momento. */
export function fotoIngrediente(productoId: string, cantidad: number, cat: Catalogo): IngredienteProduccion {
  const p = cat.productos.get(productoId);
  return {
    productoId,
    nombreProducto: p?.nombre ?? '',
    unidad: p?.unidad ?? 'ud',
    cantidad,
    precioUnitario: ppuActual(cat, productoId),
  };
}

/** Rellena los campos calculados de una producción a partir de sus ingredientes guardados. */
export function completarProduccion(
  base: Omit<Produccion, 'raciones' | 'costeLote' | 'costeRacion' | 'costeUnidad' | 'precioCobrar'>,
): Produccion {
  const lote = calcularLote(base.ingredientes, base.salen, base.porRacion, base.cuenta === 'raciones', base.redondeo);
  return { ...base, ...lote };
}
