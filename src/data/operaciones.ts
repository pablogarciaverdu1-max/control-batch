// Operaciones sobre los datos. Son funciones puras: reciben el estado y devuelven
// los registros que cambian. Quien las llama los guarda (local + cola de envío).
import type { Ajustes, Plato, Precio, Producto, Produccion } from './model';
import { ordenarPrecios, platosQueUsan } from '../calc/calc';

export interface Datos {
  productos: Producto[];
  precios: Precio[];
  platos: Plato[];
  producciones: Produccion[];
  ajustes: Ajustes;
}

export interface Cambios {
  productos?: Producto[];
  precios?: Precio[];
  platos?: Plato[];
  producciones?: Produccion[];
  ajustes?: Ajustes;
}

export type Tipo = 'productos' | 'precios' | 'platos' | 'producciones';

/** Aplica cambios a un estado: sustituye por id o añade. */
export function aplicar(d: Datos, c: Cambios): Datos {
  const merge = <T extends { id: string }>(lista: T[], nuevos?: T[]): T[] => {
    if (!nuevos?.length) return lista;
    const m = new Map(lista.map((x) => [x.id, x]));
    for (const n of nuevos) m.set(n.id, n);
    return [...m.values()];
  };
  return {
    productos: merge(d.productos, c.productos),
    precios: merge(d.precios, c.precios),
    platos: merge(d.platos, c.platos),
    producciones: merge(d.producciones, c.producciones),
    ajustes: c.ajustes ?? d.ajustes,
  };
}

/** Quita los registros borrados para enseñarlos. */
export function vivos(d: Datos): Datos {
  return {
    productos: d.productos.filter((x) => !x.borrado),
    precios: d.precios.filter((x) => !x.borrado),
    platos: d.platos.filter((x) => !x.borrado),
    producciones: d.producciones.filter((x) => !x.borrado),
    ajustes: d.ajustes,
  };
}

export function nuevoId(prefijo: string): string {
  const r = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return prefijo + '-' + r;
}

/** Cada cambio de precio crea una entrada nueva en el historial. */
export function cambiarPrecio(productoId: string, precio: number, fecha: string, ahora: number): Cambios {
  return { precios: [{ id: nuevoId('pr'), productoId, fecha, precio, creadoEn: ahora, updatedAt: ahora }] };
}

export function historial(d: Datos, productoId: string): Precio[] {
  return ordenarPrecios(d.precios.filter((p) => p.productoId === productoId && !p.borrado));
}

/** Borrar una entrada de precio. La última que queda no se puede borrar. */
export function borrarPrecio(d: Datos, precioId: string, ahora: number): Cambios | null {
  const p = d.precios.find((x) => x.id === precioId);
  if (!p || historial(d, p.productoId).length <= 1) return null;
  return { precios: [{ ...p, borrado: true, updatedAt: ahora }] };
}

/**
 * Borrar un producto: se borra con su historial y se quita de los ingredientes
 * de los platos que lo usan. Las producciones guardadas no cambian.
 */
export function borrarProducto(d: Datos, productoId: string, ahora: number): Cambios {
  const prod = d.productos.find((x) => x.id === productoId);
  if (!prod) return {};
  return {
    productos: [{ ...prod, borrado: true, updatedAt: ahora }],
    precios: d.precios.filter((p) => p.productoId === productoId && !p.borrado).map((p) => ({ ...p, borrado: true, updatedAt: ahora })),
    platos: platosQueUsan(productoId, d.platos).map((pl) => ({
      ...pl, ingredientes: pl.ingredientes.filter((i) => i.productoId !== productoId), updatedAt: ahora,
    })),
  };
}

export function borrarPlato(d: Datos, platoId: string, ahora: number): Cambios {
  const pl = d.platos.find((x) => x.id === platoId);
  return pl ? { platos: [{ ...pl, borrado: true, updatedAt: ahora }] } : {};
}

export function borrarProduccion(d: Datos, produccionId: string, ahora: number): Cambios {
  const pr = d.producciones.find((x) => x.id === produccionId);
  return pr ? { producciones: [{ ...pr, borrado: true, updatedAt: ahora }] } : {};
}

/**
 * Deshacer: devuelve los registros tal como estaban antes de `cambios`,
 * con una marca de tiempo nueva para que ganen a la versión borrada.
 */
export function deshacer(antes: Datos, cambios: Cambios, ahora: number): Cambios {
  const original = <T extends { id: string }>(lista: T[], cambiados?: T[]): T[] | undefined =>
    cambiados?.map((c) => lista.find((x) => x.id === c.id)).filter((x): x is T => !!x).map((x) => ({ ...x, updatedAt: ahora }));
  return {
    productos: original(antes.productos, cambios.productos),
    precios: original(antes.precios, cambios.precios),
    platos: original(antes.platos, cambios.platos),
    producciones: original(antes.producciones, cambios.producciones),
  };
}

export function duplicarPlato(d: Datos, platoId: string, ahora: number): Cambios {
  const pl = d.platos.find((x) => x.id === platoId);
  if (!pl) return {};
  return {
    platos: [{
      ...pl, id: nuevoId('pl'), nombre: pl.nombre + ' (copia)', borrado: false, updatedAt: ahora,
      ingredientes: pl.ingredientes.map((i) => ({ ...i })),
    }],
  };
}
