// Datos iniciales reales. Cada producto empieza con una sola entrada de precio
// fechada el día en que se cargan. Sin producciones.
import type { Ajustes, Plato, Precio, Producto, Unidad } from './model';
import { ID_AJUSTES, pasoPorDefecto } from './model';

type FilaProducto = [id: string, nombre: string, supermercado: string, precio: number, contenido: number, unidad: Unidad, paso?: number];

const PRODUCTOS: FilaProducto[] = [
  ['espinazo', 'Espinazo de cerdo', 'Mercadona', 1.7, 1, 'envase'],
  ['muslitos', 'Muslitos de pollo', 'Mercadona', 3.37, 5, 'ud'],
  ['garbanzo', 'Garbanzo pedrosillano', 'Mercadona', 0.9, 570, 'g'],
  ['guisantes', 'Guisantes', 'Mercadona', 0.95, 1, 'envase'],
  ['tomate', 'Tomate triturado', 'Mercadona', 0.55, 1, 'envase'],
  ['setas', 'Setas deshidratadas', 'Aldi', 3.0, 1, 'envase'],
  ['verduras', 'Preparado de verduras para caldo', 'Aldi', 2.0, 1, 'envase'],
  ['pan', 'Pan bimbo sin corteza', 'Mercadona', 1.05, 18, 'ud'],
  ['huevos', 'Huevos', 'Mercadona', 1.8, 6, 'ud'],
  ['cebolla', 'Cebolla tierna', 'Mercadona', 1.7, 3, 'ud'],
  ['picada', 'Carne picada cerdo/ternera', 'Mercadona', 8.0, 1000, 'g'],
  ['caldo-pollo', 'Caldo de pollo', 'Mercadona', 0.75, 1000, 'ml', 50],
  ['caldo-cocido', 'Caldo de cocido', 'Mercadona', 0.9, 1000, 'ml', 50],
  ['pimiento', 'Pimiento verde', 'Mercadona', 0.23, 1, 'ud'],
  ['arroz', 'Arroz redondo', 'Mercadona', 1.15, 1000, 'g'],
  ['contramuslos', 'Contramuslos de pollo deshuesados', 'Mercadona', 3.74, 550, 'g'],
  ['zanahoria', 'Zanahoria', 'Mercadona', 1.0, 1, 'ud'],
  ['soja', 'Salsa de soja', 'Mercadona', 1.2, 250, 'ml', 5],
  ['coco', 'Leche de coco', 'Mercadona', 1.3, 1, 'envase'],
  ['patata', 'Patata', 'Mercadona', 0.37, 1, 'ud'],
  ['pollo-entero', 'Pollo entero', 'Mercadona', 8.6, 1, 'ud'],
  ['curry', 'Curry en especia', 'Otro', 1.1, 57, 'g', 5],
];

type FilaPlato = [id: string, nombre: string, cuenta: string, singular: string, salen: number, porRacion: number, items: [string, number][]];

const PLATOS: FilaPlato[] = [
  ['pollo-curry', 'Pollo al curry', 'raciones', '', 4, 1,
    [['contramuslos', 300], ['coco', 1], ['tomate', 0.5], ['curry', 10], ['cebolla', 0.5]]],
  ['albondigas', 'Albóndigas en salsa con guisantes', 'albóndigas', 'albóndiga', 30, 5,
    [['picada', 500], ['cebolla', 2], ['guisantes', 0.5], ['pan', 1], ['verduras', 1], ['espinazo', 1], ['huevos', 1], ['tomate', 0.5]]],
  ['garbanzos', 'Guiso de garbanzos con pollo', 'raciones', '', 4, 1,
    [['garbanzo', 570], ['muslitos', 5], ['tomate', 0.5], ['setas', 1], ['cebolla', 0.5], ['pimiento', 0.5], ['espinazo', 1], ['verduras', 1]]],
  ['arroz-pollo', 'Arroz con pollo y verduras', 'raciones', '', 4, 1,
    [['contramuslos', 150], ['huevos', 1], ['guisantes', 0.25], ['zanahoria', 0.5], ['cebolla', 0.5], ['soja', 30]]],
  ['pollo-horno', 'Pollo al horno con patatas', 'raciones', '', 4, 1,
    [['pollo-entero', 0.4], ['patata', 2], ['cebolla', 1], ['zanahoria', 1]]],
];

export interface DatosIniciales {
  productos: Producto[];
  precios: Precio[];
  platos: Plato[];
  ajustes: Ajustes;
}

/** @param hoy AAAA-MM-DD  @param ahora ms */
export function datosIniciales(hoy: string, ahora: number): DatosIniciales {
  const productos: Producto[] = PRODUCTOS.map(([id, nombre, supermercado, , contenido, unidad, paso]) => ({
    id: 'p-' + id, nombre, supermercado, contenido, unidad, paso: paso ?? pasoPorDefecto(unidad), updatedAt: ahora,
  }));
  const precios: Precio[] = PRODUCTOS.map(([id, , , precio], i) => ({
    id: 'pr-' + id + '-1', productoId: 'p-' + id, fecha: hoy, precio, creadoEn: ahora + i, updatedAt: ahora,
  }));
  const platos: Plato[] = PLATOS.map(([id, nombre, cuenta, singular, salen, porRacion, items]) => ({
    id: 'pl-' + id, nombre, cuenta, singular, salen, porRacion, updatedAt: ahora,
    ingredientes: items.map(([pid, cantidad]) => ({ productoId: 'p-' + pid, cantidad })),
  }));
  return { productos, precios, platos, ajustes: { id: ID_AJUSTES, redondeo: 0.1, updatedAt: ahora } };
}

const ORDEN_INICIAL = new Map<string, number>([
  ...PRODUCTOS.map(([id], i): [string, number] => ['p-' + id, i]),
  ...PLATOS.map(([id], i): [string, number] => ['pl-' + id, i]),
]);

/**
 * Clave para ordenar productos y platos por antigüedad: primero los iniciales
 * en su orden y después los nuevos por su hora de creación (va en el id).
 */
export function claveOrden(id: string): number {
  const i = ORDEN_INICIAL.get(id);
  if (i !== undefined) return i;
  const t = parseInt(id.split('-')[1] ?? '', 36);
  return Number.isFinite(t) ? t : Number.MAX_SAFE_INTEGER;
}
