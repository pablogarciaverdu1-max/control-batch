// Copia local de los datos en IndexedDB (Dexie), para arrancar rápido y funcionar sin conexión.
import Dexie, { type Table } from 'dexie';
import type { Ajustes, Plato, Precio, Producto, Produccion } from './model';

export interface EnCola {
  n?: number;
  tipo: 'productos' | 'precios' | 'platos' | 'producciones' | 'ajustes';
  registro: { id: string; updatedAt: number };
}

export interface Meta {
  k: string;
  v: unknown;
}

class BaseLocal extends Dexie {
  productos!: Table<Producto, string>;
  precios!: Table<Precio, string>;
  platos!: Table<Plato, string>;
  producciones!: Table<Produccion, string>;
  ajustes!: Table<Ajustes, string>;
  cola!: Table<EnCola, number>;
  meta!: Table<Meta, string>;
  constructor() {
    super('mi-cocina');
    this.version(1).stores({
      productos: 'id', precios: 'id', platos: 'id', producciones: 'id', ajustes: 'id', cola: '++n', meta: 'k',
    });
  }
}

export const db = new BaseLocal();
