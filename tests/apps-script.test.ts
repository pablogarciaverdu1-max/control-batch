import { describe, expect, it } from 'vitest';
import { crearSimulador } from '../apps-script/simulador';
import { datosIniciales } from '../src/data/seed';
import { completarProduccion, crearCatalogo, fotoIngrediente } from '../src/calc/calc';

const pedir = (s: ReturnType<typeof crearSimulador>, accion: string, datos?: unknown, clave = '1234') =>
  JSON.parse(s.post(JSON.stringify({ clave, accion, datos })));

describe('Apps Script', () => {
  it('doGet no devuelve datos', () => {
    const r = JSON.parse(crearSimulador().get());
    expect(r.ok).toBe(true);
    expect(r.datos).toBeUndefined();
  });
  it('rechaza una clave incorrecta y un cuerpo roto', () => {
    const s = crearSimulador();
    expect(pedir(s, 'leer', undefined, 'mala')).toMatchObject({ ok: false, error: 'clave' });
    expect(JSON.parse(s.post('no es json'))).toMatchObject({ ok: false, error: 'peticion' });
    expect(pedir(crearSimulador(null), 'leer')).toMatchObject({ ok: false, error: 'sinClave' });
  });
  it('crea las 7 pestañas', () => {
    const s = crearSimulador();
    pedir(s, 'comprobar');
    expect([...s.hojas.keys()]).toEqual(['Productos', 'Precios', 'Platos', 'IngredientesPlato', 'Producciones', 'IngredientesProduccion', 'Ajustes']);
  });
  it('carga los datos iniciales una sola vez y los devuelve igual', () => {
    const s = crearSimulador();
    const ini = datosIniciales('2026-10-11', 1000);
    expect(pedir(s, 'cargarIniciales', ini)).toEqual({ ok: true, cargado: true });
    expect(pedir(s, 'cargarIniciales', ini)).toEqual({ ok: true, cargado: false });
    const r = pedir(s, 'leer');
    expect(r.datos.productos).toEqual(ini.productos.map((p) => ({ ...p, borrado: false })));
    expect(r.datos.precios).toEqual(ini.precios.map((p) => ({ ...p, borrado: false })));
    expect(r.datos.platos).toEqual(ini.platos.map((p) => ({ ...p, borrado: false })));
    expect(r.datos.ajustes).toEqual(ini.ajustes);
    expect(r.datos.precios[0].fecha).toBe('2026-10-11'); // la fecha no se convierte
  });
  it('gana el cambio más reciente por updatedAt', () => {
    const s = crearSimulador();
    const ini = datosIniciales('2026-10-11', 1000);
    pedir(s, 'cargarIniciales', ini);
    const p = ini.productos[0];
    expect(pedir(s, 'guardar', { productos: [{ ...p, nombre: 'Nuevo', updatedAt: 3000 }] }).aplicados).toBe(1);
    expect(pedir(s, 'guardar', { productos: [{ ...p, nombre: 'Viejo', updatedAt: 2000 }] }).aplicados).toBe(0);
    expect(pedir(s, 'leer').datos.productos[0].nombre).toBe('Nuevo');
  });
  it('guarda platos y producciones con sus ingredientes', () => {
    const s = crearSimulador();
    const ini = datosIniciales('2026-10-11', 1000);
    pedir(s, 'cargarIniciales', ini);
    const cat = crearCatalogo(ini.productos, ini.precios);
    const pl = ini.platos[1];
    const prod = completarProduccion({
      id: 'prod-1', platoId: pl.id, nombrePlato: pl.nombre, fecha: '2026-10-10', salen: 34, cuenta: pl.cuenta, singular: pl.singular,
      porRacion: pl.porRacion, redondeo: 0.1, updatedAt: 2000, ingredientes: pl.ingredientes.map((i) => fotoIngrediente(i.productoId, i.cantidad, cat)),
    });
    pedir(s, 'guardar', { producciones: [prod], platos: [{ ...pl, ingredientes: pl.ingredientes.slice(1), updatedAt: 2000 }] });
    const d = pedir(s, 'leer').datos;
    expect(d.producciones).toEqual([{ ...prod, borrado: false }]);
    expect(d.platos[1].ingredientes).toEqual(pl.ingredientes.slice(1));
    expect(d.platos[0].ingredientes).toEqual(ini.platos[0].ingredientes);
  });
  it('cambia la clave y la anterior deja de valer', () => {
    const s = crearSimulador();
    expect(pedir(s, 'cambiarClave', { nueva: 'ab' }).ok).toBe(false);
    expect(pedir(s, 'cambiarClave', { nueva: 'nueva-clave' }).ok).toBe(true);
    expect(pedir(s, 'leer').error).toBe('clave');
    expect(pedir(s, 'leer', undefined, 'nueva-clave').ok).toBe(true);
  });
});
