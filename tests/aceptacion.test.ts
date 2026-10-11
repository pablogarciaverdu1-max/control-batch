import { describe, expect, it } from 'vitest';
import { completarProduccion, costePlato, crearCatalogo, fotoIngrediente, platosQueUsan } from '../src/calc/calc';
import { euros } from '../src/calc/format';
import { datosIniciales } from '../src/data/seed';
import { aplicar, borrarPlato, borrarPrecio, borrarProducto, cambiarPrecio, deshacer, duplicarPlato, historial, vivos, type Datos } from '../src/data/operaciones';

const HOY = '2026-10-11';
function estado(): Datos {
  const s = datosIniciales('2026-10-01', 1_000);
  const cat = crearCatalogo(s.productos, s.precios);
  // Una producción guardada de cada plato que lleva contramuslos
  const producciones = s.platos.filter((p) => p.id === 'pl-pollo-curry' || p.id === 'pl-arroz-pollo').map((pl) =>
    completarProduccion({
      id: 'prod-' + pl.id, platoId: pl.id, nombrePlato: pl.nombre, fecha: '2026-10-02', salen: pl.salen, cuenta: pl.cuenta,
      singular: pl.singular, porRacion: pl.porRacion, redondeo: 0.1, updatedAt: 1_000,
      ingredientes: pl.ingredientes.map((i) => fotoIngrediente(i.productoId, i.cantidad, cat)),
    }));
  return { ...s, producciones };
}
const cost = (d: Datos, platoId: string) => {
  const v = vivos(d);
  return costePlato(v.platos.find((p) => p.id === platoId)!, crearCatalogo(v.productos, v.precios), 0.1);
};

describe('cambiar el precio del tomate desde Compras', () => {
  it('crea entrada nueva, pone 0,60 € y cambia 3 platos sin tocar producciones', () => {
    const d0 = estado();
    const antes = { curry: cost(d0, 'pl-pollo-curry').costeLote, alb: cost(d0, 'pl-albondigas').costeLote, gar: cost(d0, 'pl-garbanzos').costeLote };
    expect(platosQueUsan('p-tomate', d0.platos).map((p) => p.nombre)).toEqual([
      'Pollo al curry', 'Albóndigas en salsa con guisantes', 'Guiso de garbanzos con pollo']);
    const d1 = aplicar(d0, cambiarPrecio('p-tomate', 0.6, HOY, 2_000));
    const h = historial(d1, 'p-tomate');
    expect(h).toHaveLength(2);
    expect(h[0].fecha).toBe(HOY);
    expect(h[0].precio).toBe(0.6);
    expect(crearCatalogo(d1.productos, d1.precios).precio.get('p-tomate')).toBe(0.6);
    // 0,5 envase × 0,05 € más = 0,025 € más en cada plato
    expect(cost(d1, 'pl-pollo-curry').costeLote - antes.curry).toBeCloseTo(0.025, 9);
    expect(cost(d1, 'pl-albondigas').costeLote - antes.alb).toBeCloseTo(0.025, 9);
    expect(cost(d1, 'pl-garbanzos').costeLote - antes.gar).toBeCloseTo(0.025, 9);
    expect(d1.producciones).toEqual(d0.producciones);
  });
});

describe('borrar los contramuslos', () => {
  it('nombra los platos, baja 2,04 € y 1,02 €, mantiene producciones y Deshacer lo restaura', () => {
    const d0 = estado();
    const usan = platosQueUsan('p-contramuslos', d0.platos);
    expect(usan.map((p) => p.nombre)).toEqual(['Pollo al curry', 'Arroz con pollo y verduras']);
    const c = borrarProducto(d0, 'p-contramuslos', 3_000);
    const d1 = aplicar(d0, c);
    expect(euros(cost(d0, 'pl-pollo-curry').costeLote - cost(d1, 'pl-pollo-curry').costeLote)).toBe('2,04 €');
    expect(euros(cost(d0, 'pl-arroz-pollo').costeLote - cost(d1, 'pl-arroz-pollo').costeLote)).toBe('1,02 €');
    const v1 = vivos(d1);
    expect(v1.productos.some((p) => p.id === 'p-contramuslos')).toBe(false);
    expect(v1.precios.some((p) => p.productoId === 'p-contramuslos')).toBe(false);
    expect(v1.platos.find((p) => p.id === 'pl-pollo-curry')!.ingredientes.some((i) => i.productoId === 'p-contramuslos')).toBe(false);
    // Las producciones siguen con nombre y unidad del producto
    expect(d1.producciones).toEqual(d0.producciones);
    const ing = d1.producciones[0].ingredientes.find((i) => i.productoId === 'p-contramuslos')!;
    expect(ing.nombreProducto).toBe('Contramuslos de pollo deshuesados');
    expect(ing.unidad).toBe('g');
    // Deshacer
    const d2 = aplicar(d1, deshacer(d0, c, 4_000));
    const strip = (d: Datos) => JSON.parse(JSON.stringify(vivos(d), (k, v) => (k === 'updatedAt' ? undefined : v)));
    expect(strip(d2)).toEqual(strip(d0));
    expect(euros(cost(d2, 'pl-pollo-curry').costeLote)).toBe('4,09 €');
  });
});

describe('otros borrados', () => {
  it('borrar un plato deja sus producciones', () => {
    const d0 = estado();
    const d1 = aplicar(d0, borrarPlato(d0, 'pl-pollo-curry', 5_000));
    expect(vivos(d1).platos.some((p) => p.id === 'pl-pollo-curry')).toBe(false);
    expect(vivos(d1).producciones.find((p) => p.platoId === 'pl-pollo-curry')!.nombrePlato).toBe('Pollo al curry');
  });
  it('la última entrada de precio no se puede borrar', () => {
    const d0 = estado();
    expect(borrarPrecio(d0, 'pr-tomate-1', 6_000)).toBeNull();
    const d1 = aplicar(d0, cambiarPrecio('p-tomate', 0.6, HOY, 2_000));
    expect(borrarPrecio(d1, 'pr-tomate-1', 6_000)).not.toBeNull();
  });
  it('duplicar crea «Nombre (copia)» con los mismos ingredientes', () => {
    const d0 = estado();
    const c = duplicarPlato(d0, 'pl-albondigas', 7_000);
    expect(c.platos![0].nombre).toBe('Albóndigas en salsa con guisantes (copia)');
    expect(c.platos![0].ingredientes).toEqual(d0.platos.find((p) => p.id === 'pl-albondigas')!.ingredientes);
    expect(c.platos![0].id).not.toBe('pl-albondigas');
  });
});
