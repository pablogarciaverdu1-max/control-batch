// Estado de Nueva producción (y de Corregir), compartido por móvil y ordenador.
// El borrador se guarda siempre en el dispositivo para no perderlo.
import { useEffect, useMemo, useRef, useState } from 'react';
import { calcularLote, completarProduccion, ppuActual, type Lote } from '../../calc/calc';
import { ayerIso, hoyIso } from '../../calc/fechas';
import { leerNumero } from '../../calc/format';
import { almacen, useApp } from '../../data/almacen';
import { pasoPorDefecto, type Plato, type Produccion, type Unidad } from '../../data/model';
import { nuevoId } from '../../data/operaciones';

export interface ItemBorrador {
  productoId: string;
  cantidad: number;
  /** Cantidad de la receta; 0 si se ha añadido hoy. */
  receta: number;
  /** Datos guardados en la producción que se corrige (precio de ese día). */
  guardado?: { nombre: string; unidad: Unidad; precioUnitario: number };
}

export interface Borrador {
  paso: 1 | 2 | 3;
  fecha: string;
  platoId: string;
  salen: number;
  items: ItemBorrador[];
}

export interface ItemVista {
  i: number;
  productoId: string;
  nombre: string;
  unidad: Unidad;
  cantidad: number;
  receta: number;
  ppu: number;
  coste: number;
  paso: number;
}

export interface PlatoBase {
  nombre: string;
  cuenta: string;
  singular: string;
  porRacion: number;
  salen: number;
}

const clave = (corregirId?: string) => 'borrador:' + (corregirId ?? 'nueva');

function desdePlato(pl: Plato, existe: (id: string) => boolean): Pick<Borrador, 'platoId' | 'salen' | 'items'> {
  return {
    platoId: pl.id,
    salen: pl.salen,
    items: pl.ingredientes.filter((i) => existe(i.productoId)).map((i) => ({ productoId: i.productoId, cantidad: i.cantidad, receta: i.cantidad })),
  };
}

function desdeProduccion(p: Produccion, plato: Plato | undefined): Borrador {
  return {
    paso: 2,
    fecha: p.fecha,
    platoId: p.platoId,
    salen: p.salen,
    items: p.ingredientes.map((i) => ({
      productoId: i.productoId,
      cantidad: i.cantidad,
      receta: plato?.ingredientes.find((x) => x.productoId === i.productoId)?.cantidad ?? i.cantidad,
      guardado: { nombre: i.nombreProducto, unidad: i.unidad, precioUnitario: i.precioUnitario },
    })),
  };
}

export function useProduccion(opc: { platoInicial?: string | null; corregirId?: string }) {
  const { d, cat, listo, sync } = useApp();
  const [b, setB] = useState<Borrador | null>(null);
  const [editando, setEditando] = useState(-1);
  const [texto, setTexto] = useState('');
  const cargado = useRef(false);
  const original = opc.corregirId ? d.producciones.find((p) => p.id === opc.corregirId) : undefined;

  // Cargar el borrador guardado o empezar uno nuevo
  useEffect(() => {
    if (!listo || cargado.current) return;
    if (opc.corregirId && !original) return;
    cargado.current = true;
    (async () => {
      const guardado = await almacen.leerMeta<Borrador>(clave(opc.corregirId));
      const existe = (id: string) => cat.productos.has(id);
      if (guardado && (opc.corregirId || !opc.platoInicial || guardado.platoId === opc.platoInicial)) {
        setB(guardado);
        return;
      }
      if (original) {
        setB(desdeProduccion(original, d.platos.find((p) => p.id === original.platoId)));
        return;
      }
      const pl = d.platos.find((p) => p.id === opc.platoInicial) ?? d.platos[0];
      setB({ paso: 1, fecha: hoyIso(), ...(pl ? desdePlato(pl, existe) : { platoId: '', salen: 1, items: [] }) });
    })();
  }, [listo, original, opc.corregirId, opc.platoInicial, d.platos, cat]);

  // Guardar el borrador en cada cambio
  useEffect(() => {
    if (b) almacen.ponerMeta(clave(opc.corregirId), b);
  }, [b, opc.corregirId]);

  const plato = b ? d.platos.find((p) => p.id === b.platoId) : undefined;
  const base: PlatoBase | null = original
    ? { nombre: original.nombrePlato, cuenta: original.cuenta, singular: original.singular, porRacion: original.porRacion, salen: plato?.salen ?? original.salen }
    : plato ? { nombre: plato.nombre, cuenta: plato.cuenta, singular: plato.singular, porRacion: plato.porRacion, salen: plato.salen } : null;

  const items: ItemVista[] = useMemo(() => {
    if (!b) return [];
    const out: ItemVista[] = [];
    b.items.forEach((it, i) => {
      const prod = cat.productos.get(it.productoId);
      if (!prod && !it.guardado) return;
      const unidad = it.guardado?.unidad ?? prod!.unidad;
      const ppu = it.guardado ? it.guardado.precioUnitario : ppuActual(cat, it.productoId);
      out.push({
        i, productoId: it.productoId, nombre: it.guardado?.nombre ?? prod!.nombre, unidad, cantidad: it.cantidad, receta: it.receta,
        ppu, coste: it.cantidad * ppu, paso: prod?.paso || pasoPorDefecto(unidad),
      });
    });
    return out;
  }, [b, cat]);

  const enRaciones = (base?.cuenta ?? 'raciones') === 'raciones';
  const lote: Lote = calcularLote(
    items.map((x) => ({ cantidad: x.cantidad, precioUnitario: x.ppu })),
    b?.salen ?? 0, base?.porRacion ?? 1, enRaciones, original?.redondeo ?? d.ajustes.redondeo,
  );

  const cambiar = (f: (x: Borrador) => Borrador) => setB((x) => (x ? f(x) : x));
  const setItem = (i: number, cantidad: number) =>
    cambiar((x) => ({ ...x, items: x.items.map((it, j) => (j === i ? { ...it, cantidad: Math.max(0, Math.round(cantidad * 100) / 100) } : it)) }));

  const disponibles = d.productos.filter((p) => !b?.items.some((i) => i.productoId === p.id));

  const fechaOpcion: 'hoy' | 'ayer' | 'otra' = !b ? 'hoy' : b.fecha === hoyIso() ? 'hoy' : b.fecha === ayerIso() ? 'ayer' : 'otra';

  return {
    b, base, plato, original, items, lote, enRaciones, disponibles, fechaOpcion,
    precioEnvase: (id: string) => cat.precio.get(id) ?? 0,
    platos: d.platos, redondeo: original?.redondeo ?? d.ajustes.redondeo,
    sinConexion: sync === 'sin conexión',
    editando, texto, setTexto,
    setPaso: (paso: 1 | 2 | 3) => { setEditando(-1); cambiar((x) => ({ ...x, paso })); },
    setFecha: (fecha: string) => cambiar((x) => ({ ...x, fecha })),
    elegirPlato: (pl: Plato) => { setEditando(-1); cambiar((x) => ({ ...x, ...desdePlato(pl, (id) => cat.productos.has(id)) })); },
    volverAReceta: () => { if (plato) { setEditando(-1); cambiar((x) => ({ ...x, ...desdePlato(plato, (id) => cat.productos.has(id)) })); } },
    mas: (it: ItemVista) => setItem(it.i, it.cantidad + it.paso),
    menos: (it: ItemVista) => setItem(it.i, it.cantidad - it.paso),
    quitar: (it: ItemVista) => { setEditando(-1); cambiar((x) => ({ ...x, items: x.items.filter((_, j) => j !== it.i) })); },
    anadir: (productoId: string) => {
      const p = cat.productos.get(productoId);
      if (!p) return;
      cambiar((x) => ({ ...x, items: x.items.concat([{ productoId, cantidad: p.unidad === 'g' || p.unidad === 'ml' ? 100 : 1, receta: 0 }]) }));
    },
    empezarEdicion: (it: ItemVista) => { setEditando(it.i); setTexto(String(Math.round(it.cantidad * 100) / 100).replace('.', ',')); },
    terminarEdicion: () => {
      const v = leerNumero(texto);
      if (v !== null && editando >= 0) setItem(editando, Math.max(0, v));
      setEditando(-1);
    },
    masSalen: () => cambiar((x) => ({ ...x, salen: x.salen + 1 })),
    menosSalen: () => cambiar((x) => ({ ...x, salen: Math.max(1, x.salen - 1) })),

    /** Guarda la producción (nueva o corregida) y borra el borrador. */
    async guardar(): Promise<Produccion | null> {
      if (!b || !base) return null;
      const escrito = editando >= 0 ? leerNumero(texto) : null;
      const finales = items.map((x) => (x.i === editando && escrito !== null ? { ...x, cantidad: Math.max(0, escrito) } : x));
      const prod = completarProduccion({
        id: original?.id ?? nuevoId('prod'),
        platoId: b.platoId,
        nombrePlato: base.nombre,
        fecha: b.fecha,
        salen: b.salen,
        cuenta: base.cuenta,
        singular: base.singular,
        porRacion: enRaciones ? 1 : base.porRacion,
        redondeo: original?.redondeo ?? d.ajustes.redondeo,
        updatedAt: Date.now(),
        ingredientes: finales.map((x) => ({ productoId: x.productoId, nombreProducto: x.nombre, unidad: x.unidad, cantidad: x.cantidad, precioUnitario: x.ppu })),
      });
      await almacen.guardar({ producciones: [prod] });
      await almacen.ponerMeta(clave(opc.corregirId), undefined);
      return prod;
    },
    async descartar() {
      await almacen.ponerMeta(clave(opc.corregirId), undefined);
    },
  };
}

export type EstadoProduccion = ReturnType<typeof useProduccion>;
