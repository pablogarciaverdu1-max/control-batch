// Almacenamiento en el dispositivo. Normalmente IndexedDB (Dexie); si el navegador
// no lo permite (modo privado, navegador dentro de otra app…), se usa la memoria
// para que la app funcione igualmente, aunque sin copia al cerrar.
import { db, type EnCola } from './db';
import { ID_AJUSTES, type Ajustes, type Plato, type Precio, type Producto, type Produccion } from './model';
import type { Cambios } from './operaciones';

export interface Leido {
  productos: Producto[];
  precios: Precio[];
  platos: Plato[];
  producciones: Produccion[];
  ajustes?: Ajustes;
}

export interface Local {
  persistente: boolean;
  leerTodo(): Promise<Leido>;
  guardar(c: Cambios, cola: EnCola[]): Promise<void>;
  colaTodos(): Promise<EnCola[]>;
  colaBorrar(ns: number[]): Promise<void>;
  metaLeer(k: string): Promise<unknown>;
  metaPoner(k: string, v: unknown): Promise<void>;
  limpiar(): Promise<void>;
}

const conLimite = <T>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<T>((_, no) => setTimeout(() => no(new Error('IndexedDB no responde')), ms))]);

const dexie: Local = {
  persistente: true,
  async leerTodo() {
    const [productos, precios, platos, producciones, ajustes] = await Promise.all([
      db.productos.toArray(), db.precios.toArray(), db.platos.toArray(), db.producciones.toArray(), db.ajustes.get(ID_AJUSTES),
    ]);
    return { productos, precios, platos, producciones, ajustes };
  },
  async guardar(c, cola) {
    await db.transaction('rw', [db.productos, db.precios, db.platos, db.producciones, db.ajustes, db.cola], async () => {
      if (c.productos?.length) await db.productos.bulkPut(c.productos);
      if (c.precios?.length) await db.precios.bulkPut(c.precios);
      if (c.platos?.length) await db.platos.bulkPut(c.platos);
      if (c.producciones?.length) await db.producciones.bulkPut(c.producciones);
      if (c.ajustes) await db.ajustes.put(c.ajustes);
      if (cola.length) await db.cola.bulkAdd(cola);
    });
  },
  colaTodos: () => db.cola.toArray(),
  colaBorrar: (ns) => db.cola.bulkDelete(ns),
  async metaLeer(k) {
    return (await db.meta.get(k))?.v;
  },
  async metaPoner(k, v) {
    if (v === undefined) await db.meta.delete(k);
    else await db.meta.put({ k, v });
  },
  async limpiar() {
    await Promise.all([db.productos.clear(), db.precios.clear(), db.platos.clear(), db.producciones.clear(), db.ajustes.clear(), db.cola.clear(), db.meta.clear()]);
  },
};

function enMemoria(): Local {
  let cola: EnCola[] = [];
  let n = 0;
  const meta = new Map<string, unknown>();
  return {
    persistente: false,
    leerTodo: async () => ({ productos: [], precios: [], platos: [], producciones: [] }),
    guardar: async (_c, nuevos) => { cola = cola.concat(nuevos.map((x) => ({ ...x, n: ++n }))); },
    colaTodos: async () => cola.slice(),
    colaBorrar: async (ns) => { cola = cola.filter((x) => !ns.includes(x.n!)); },
    metaLeer: async (k) => meta.get(k),
    metaPoner: async (k, v) => { if (v === undefined) meta.delete(k); else meta.set(k, v); },
    limpiar: async () => { cola = []; meta.clear(); },
  };
}

/** Abre IndexedDB; si falla o no responde en 4 s, usa la memoria. */
export async function abrirLocal(): Promise<{ local: Local; datos: Leido }> {
  try {
    const datos = await conLimite(dexie.leerTodo(), 4000);
    return { local: dexie, datos };
  } catch (e) {
    console.warn('Sin almacenamiento en el dispositivo, se usa la memoria:', e);
    const local = enMemoria();
    return { local, datos: await local.leerTodo() };
  }
}
