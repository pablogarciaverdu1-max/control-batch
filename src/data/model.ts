// Modelo de datos. Cada registro lleva `updatedAt` (milisegundos) para resolver
// conflictos entre dispositivos: gana el cambio más reciente. Borrar no elimina
// la fila, la marca con `borrado` para que el otro dispositivo se entere.

export type Unidad = 'g' | 'ml' | 'ud' | 'envase';

export interface Registro {
  id: string;
  updatedAt: number;
  borrado?: boolean;
}

export interface Producto extends Registro {
  nombre: string;
  /** "Mercadona", "Aldi" u otro texto libre ("Otro" si no se sabe). */
  supermercado: string;
  /** Contenido del envase, en la unidad indicada. */
  contenido: number;
  unidad: Unidad;
  /** Lo que suma cada − y + en Nueva producción. */
  paso: number;
}

export interface Precio extends Registro {
  productoId: string;
  /** Día de la compra, AAAA-MM-DD. */
  fecha: string;
  /** Precio del envase en euros. */
  precio: number;
  /** Momento de creación (ms). Desempata entradas del mismo día. */
  creadoEn: number;
}

export interface IngredientePlato {
  productoId: string;
  cantidad: number;
}

export interface Plato extends Registro {
  nombre: string;
  /** 'raciones' o un plural: albóndigas, croquetas… */
  cuenta: string;
  /** Singular de `cuenta` para "por albóndiga". Vacío si se cuenta en raciones. */
  singular: string;
  /** Cuántas salen del lote. */
  salen: number;
  /** Cuántas van por ración (1 si se cuenta en raciones). */
  porRacion: number;
  ingredientes: IngredientePlato[];
}

export interface IngredienteProduccion {
  productoId: string;
  nombreProducto: string;
  unidad: Unidad;
  cantidad: number;
  /** Precio por unidad (€/g, €/ml, €/ud o €/envase) el día de la producción. */
  precioUnitario: number;
}

export interface Produccion extends Registro {
  platoId: string;
  nombrePlato: string;
  /** AAAA-MM-DD */
  fecha: string;
  ingredientes: IngredienteProduccion[];
  salen: number;
  cuenta: string;
  singular: string;
  porRacion: number;
  raciones: number;
  costeLote: number;
  costeRacion: number;
  /** Solo si el lote no se cuenta en raciones. */
  costeUnidad: number | null;
  precioCobrar: number;
  redondeo: number;
}

export type Redondeo = 0.05 | 0.1 | 0.5;

export interface Ajustes extends Registro {
  redondeo: Redondeo;
}

export const ID_AJUSTES = 'ajustes';

export const SUPERMERCADOS_FIJOS = ['Mercadona', 'Aldi'] as const;

export function pasoPorDefecto(unidad: Unidad): number {
  if (unidad === 'g') return 25;
  if (unidad === 'ml') return 10;
  return 0.25;
}

export function cuentaEnRaciones(p: { cuenta: string }): boolean {
  return p.cuenta === 'raciones';
}
