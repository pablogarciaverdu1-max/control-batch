import { describe, expect, it } from 'vitest';
import { calcularLote, completarProduccion, costePlato, crearCatalogo, fotoIngrediente, precioACobrar, preciosActuales } from '../src/calc/calc';
import { euros } from '../src/calc/format';
import { datosIniciales } from '../src/data/seed';
import type { Precio } from '../src/data/model';

const HOY = '2026-10-11';
const d = datosIniciales(HOY, 1_000);
const cat = crearCatalogo(d.productos, d.precios);
const plato = (nombre: string) => d.platos.find((p) => p.nombre === nombre)!;

describe('los cinco platos con redondeo de 0,10 €', () => {
  const casos: [string, string, string, string, string?][] = [
    ['Pollo al curry', '4,09 €', '1,02 €', '1,10 €'],
    ['Albóndigas en salsa con guisantes', '9,94 €', '1,66 €', '1,70 €', '0,33 €'],
    ['Guiso de garbanzos con pollo', '11,64 €', '2,91 €', '3,00 €'],
    ['Arroz con pollo y verduras', '2,48 €', '0,62 €', '0,70 €'],
    ['Pollo al horno con patatas', '5,75 €', '1,44 €', '1,50 €'],
  ];
  for (const [nombre, lote, racion, cobrar, unidad] of casos) {
    it(nombre, () => {
      const l = costePlato(plato(nombre), cat, 0.1);
      expect(euros(l.costeLote)).toBe(lote);
      expect(euros(l.costeRacion)).toBe(racion);
      expect(euros(l.precioCobrar)).toBe(cobrar);
      if (unidad) expect(euros(l.costeUnidad!)).toBe(unidad);
      else expect(l.costeUnidad).toBeNull();
    });
  }
  it('albóndigas: 30 a 5 por ración son 6 raciones', () => {
    expect(costePlato(plato('Albóndigas en salsa con guisantes'), cat, 0.1).raciones).toBe(6);
  });
});

describe('lote y redondeo', () => {
  it('34 albóndigas a 5 por ración salen 6,8 raciones', () => {
    expect(calcularLote([], 34, 5, false, 0.1).raciones).toBeCloseTo(6.8, 10);
  });
  it('si se cuenta en raciones, por ración vale 1 y no hay coste por unidad', () => {
    const l = calcularLote([{ cantidad: 2, precioUnitario: 2 }], 4, 7, true, 0.1);
    expect(l.raciones).toBe(4);
    expect(l.costeUnidad).toBeNull();
  });
  it('redondeo al alza al múltiplo elegido', () => {
    expect(precioACobrar(1.02, 0.05)).toBe(1.05);
    expect(precioACobrar(1.02, 0.1)).toBe(1.1);
    expect(precioACobrar(1.02, 0.5)).toBe(1.5);
    expect(precioACobrar(1.1, 0.1)).toBe(1.1); // justo en el múltiplo no sube
    expect(precioACobrar(1.5, 0.5)).toBe(1.5);
    expect(precioACobrar(2.91, 0.1)).toBe(3);
  });
});

describe('precio actual', () => {
  const e = (id: string, fecha: string, precio: number, creadoEn: number): Precio =>
    ({ id, productoId: 'x', fecha, precio, creadoEn, updatedAt: 1 });
  it('gana la fecha más reciente', () => {
    expect(preciosActuales([e('a', '2026-10-01', 1, 9), e('b', '2026-10-05', 2, 1)]).get('x')).toBe(2);
  });
  it('si empatan en fecha, gana la creada después', () => {
    expect(preciosActuales([e('a', '2026-10-05', 1, 9), e('b', '2026-10-05', 2, 3)]).get('x')).toBe(1);
  });
  it('las entradas borradas no cuentan', () => {
    expect(preciosActuales([e('a', '2026-10-01', 1, 1), { ...e('b', '2026-10-05', 2, 2), borrado: true }]).get('x')).toBe(1);
  });
});

describe('producciones', () => {
  it('cambiar un precio no cambia una producción ya guardada', () => {
    const pl = plato('Pollo al curry');
    const prod = completarProduccion({
      id: 'x', platoId: pl.id, nombrePlato: pl.nombre, fecha: HOY, salen: 4, cuenta: 'raciones', singular: '', porRacion: 1,
      redondeo: 0.1, updatedAt: 1, ingredientes: pl.ingredientes.map((i) => fotoIngrediente(i.productoId, i.cantidad, cat)),
    });
    expect(euros(prod.costeLote)).toBe('4,09 €');
    const precios2 = d.precios.concat([{ id: 'n', productoId: 'p-tomate', fecha: HOY, precio: 5, creadoEn: 99999, updatedAt: 2 }]);
    const cat2 = crearCatalogo(d.productos, precios2);
    expect(costePlato(pl, cat2, 0.1).costeLote).toBeGreaterThan(prod.costeLote);
    const recalculada = completarProduccion(prod);
    expect(euros(recalculada.costeLote)).toBe('4,09 €');
    expect(prod.ingredientes.find((i) => i.productoId === 'p-tomate')!.nombreProducto).toBe('Tomate triturado');
  });
});

describe('orden por antigüedad', async () => {
  const { claveOrden } = await import('../src/data/seed');
  const { nuevoId } = await import('../src/data/operaciones');
  it('los iniciales van en su orden y los nuevos detrás, por hora', () => {
    expect(claveOrden('pl-pollo-curry')).toBeLessThan(claveOrden('pl-albondigas'));
    const a = nuevoId('pl');
    expect(claveOrden(a)).toBeGreaterThan(claveOrden('pl-pollo-horno'));
    expect(claveOrden(a)).toBeLessThanOrEqual(Date.now());
  });
});
