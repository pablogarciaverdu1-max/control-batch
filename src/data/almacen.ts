// Almacén de la app: datos en memoria + copia local (Dexie) + cola de cambios
// que se envía al Apps Script. Si el mismo registro cambia en dos dispositivos,
// gana el último cambio (por updatedAt).
import { useSyncExternalStore } from 'react';
import { crearCatalogo, type Catalogo } from '../calc/calc';
import { hoyIso } from '../calc/fechas';
import { ErrorClave, ErrorRed, ES_DEMO, llamar, USA_SIMULADOR } from './api';
import { db, type EnCola } from './db';
import { ID_AJUSTES, type Ajustes, type Registro } from './model';
import { aplicar, vivos, type Cambios, type Datos } from './operaciones';
import { claveOrden, datosIniciales } from './seed';

export type EstadoSync = 'guardado' | 'guardando' | 'sin conexión';

export interface Estado {
  listo: boolean;
  clave: string | null;
  /** Mensaje de error de clave para la pantalla de acceso. */
  errorClave: boolean;
  sync: EstadoSync;
  online: boolean;
  /** Todos los registros, también los borrados. */
  todo: Datos;
  /** Solo los registros vivos. */
  d: Datos;
  cat: Catalogo;
}

const CLAVE_LS = 'mi-cocina-clave';
const SALIO_LS = 'mi-cocina-salio';
const AJUSTES_DEF: Ajustes = { id: ID_AJUSTES, redondeo: 0.1, updatedAt: 0 };
const VACIO: Datos = { productos: [], precios: [], platos: [], producciones: [], ajustes: AJUSTES_DEF };

function leerClave(): string | null {
  try {
    // En `npm run dev` con el simulador se entra solo con la clave 1234 (salvo tras cerrar sesión)
    const auto = USA_SIMULADOR && !ES_DEMO && !localStorage.getItem(SALIO_LS) ? '1234' : null;
    return localStorage.getItem(CLAVE_LS) ?? auto;
  } catch {
    return null;
  }
}

class Almacen {
  private estado: Estado = this.calcular(VACIO, {
    listo: false, clave: leerClave(), errorClave: false, sync: 'guardado',
    online: typeof navigator === 'undefined' ? true : navigator.onLine,
  });
  private oyentes = new Set<() => void>();
  private enCurso = false;
  private repetir = false;
  private temporizador: ReturnType<typeof setTimeout> | undefined;

  private calcular(todo: Datos, resto: Omit<Estado, 'todo' | 'd' | 'cat'>): Estado {
    const d = vivos(todo);
    const orden = (a: { id: string }, b: { id: string }) => claveOrden(a.id) - claveOrden(b.id);
    d.productos.sort(orden);
    d.platos.sort(orden);
    return { ...resto, todo, d, cat: crearCatalogo(d.productos, d.precios) };
  }

  private poner(cambios: Partial<Estado>) {
    const { todo, d: _d, cat: _c, ...resto } = { ...this.estado, ...cambios };
    this.estado = cambios.todo ? this.calcular(todo, resto) : { ...this.estado, ...cambios };
    this.oyentes.forEach((f) => f());
  }

  get = () => this.estado;
  suscribir = (f: () => void) => {
    this.oyentes.add(f);
    return () => this.oyentes.delete(f);
  };

  async iniciar() {
    const [productos, precios, platos, producciones, ajustes] = await Promise.all([
      db.productos.toArray(), db.precios.toArray(), db.platos.toArray(), db.producciones.toArray(), db.ajustes.get(ID_AJUSTES),
    ]);
    this.poner({ listo: true, todo: { productos, precios, platos, producciones, ajustes: ajustes ?? AJUSTES_DEF } });
    window.addEventListener('online', () => { this.poner({ online: true }); this.sincronizar(); });
    window.addEventListener('offline', () => this.poner({ online: false, sync: 'sin conexión' }));
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') this.sincronizar(); });
    setInterval(() => { if (document.visibilityState === 'visible') this.sincronizar(); }, 30_000);
    // Un borrado que quedó pendiente (se cerró la app antes de 6 s) se confirma ahora
    const pendiente = await this.leerMeta<Cambios>('borradoPendiente');
    if (pendiente) {
      await this.ponerMeta('borradoPendiente', undefined);
      await this.guardar(pendiente);
    }
    if (this.estado.clave) this.sincronizar();
  }

  /** Aplica cambios solo en pantalla (borrado diferido): no se guardan ni se envían todavía. */
  async enPantalla(c: Cambios) {
    await this.ponerMeta('borradoPendiente', c);
    this.poner({ todo: aplicar(this.estado.todo, c) });
  }

  /** Deshace un cambio hecho solo en pantalla, devolviendo los registros originales. */
  async restaurar(originales: Cambios) {
    await this.ponerMeta('borradoPendiente', undefined);
    this.poner({ todo: aplicar(this.estado.todo, originales) });
  }

  /** Confirma un cambio hecho solo en pantalla: se guarda y se envía. */
  async confirmar(c: Cambios) {
    await this.ponerMeta('borradoPendiente', undefined);
    await this.guardar(c);
  }

  /** Guarda cambios: al momento en pantalla y en el dispositivo; después se suben. */
  async guardar(c: Cambios) {
    this.poner({ todo: aplicar(this.estado.todo, c) });
    const cola: EnCola[] = [];
    await db.transaction('rw', [db.productos, db.precios, db.platos, db.producciones, db.ajustes, db.cola], async () => {
      for (const tipo of ['productos', 'precios', 'platos', 'producciones'] as const) {
        const lista = c[tipo] as Registro[] | undefined;
        if (!lista?.length) continue;
        await (db[tipo] as unknown as { bulkPut: (x: Registro[]) => Promise<unknown> }).bulkPut(lista);
        lista.forEach((registro) => cola.push({ tipo, registro }));
      }
      if (c.ajustes) {
        await db.ajustes.put(c.ajustes);
        cola.push({ tipo: 'ajustes', registro: c.ajustes });
      }
      await db.cola.bulkAdd(cola);
    });
    if (this.estado.online) this.poner({ sync: 'guardando' });
    this.programar(300);
  }

  private programar(ms: number) {
    clearTimeout(this.temporizador);
    this.temporizador = setTimeout(() => this.sincronizar(), ms);
  }

  /** Envía la cola y trae los datos de la hoja. */
  async sincronizar(conClave?: string): Promise<void> {
    const clave = conClave ?? this.estado.clave;
    if (!clave) return;
    if (this.enCurso) { this.repetir = true; return; }
    if (!navigator.onLine) { this.poner({ online: false, sync: 'sin conexión' }); return; }
    this.enCurso = true;
    try {
      const pendientes = await db.cola.toArray();
      if (pendientes.length) {
        this.poner({ sync: 'guardando' });
        const paquete: Record<string, unknown> = {};
        const ultimos = new Map<string, EnCola>();
        for (const p of pendientes) ultimos.set(p.tipo + ':' + p.registro.id, p);
        for (const p of ultimos.values()) {
          if (p.tipo === 'ajustes') paquete.ajustes = p.registro;
          else ((paquete[p.tipo] ??= []) as unknown[]).push(p.registro);
        }
        await llamar(clave, 'guardar', paquete);
        await db.cola.bulkDelete(pendientes.map((p) => p.n!));
      }
      await this.traer(clave);
      this.poner({ sync: (await db.cola.count()) ? 'guardando' : 'guardado', online: true });
    } catch (e) {
      if (e instanceof ErrorClave) { this.olvidarClave(); return; }
      this.poner({ sync: 'sin conexión' });
      if (!(e instanceof ErrorRed)) console.error(e);
    } finally {
      this.enCurso = false;
      if (this.repetir) { this.repetir = false; this.programar(50); }
    }
  }

  private async traer(clave: string) {
    type Leido = { datos: Omit<Datos, 'ajustes'> & { ajustes: Ajustes | null } };
    let r = await llamar<Leido>(clave, 'leer');
    if (!r.datos.ajustes && !r.datos.productos.length) {
      await llamar(clave, 'cargarIniciales', datosIniciales(hoyIso(), Date.now()));
      r = await llamar<Leido>(clave, 'leer');
    }
    const pendientes = new Set((await db.cola.toArray()).map((p) => p.tipo + ':' + p.registro.id));
    const local = this.estado.todo;
    const cambios: Cambios = {};
    for (const tipo of ['productos', 'precios', 'platos', 'producciones'] as const) {
      const actuales = new Map((local[tipo] as Registro[]).map((x) => [x.id, x]));
      const nuevos = (r.datos[tipo] as Registro[]).filter((x) => {
        if (pendientes.has(tipo + ':' + x.id)) return false;
        const l = actuales.get(x.id);
        return !l || x.updatedAt > l.updatedAt || (x.updatedAt === l.updatedAt && JSON.stringify(x) !== JSON.stringify(l));
      });
      if (nuevos.length) (cambios as Record<string, Registro[]>)[tipo] = nuevos;
    }
    const aj = r.datos.ajustes;
    if (aj && !pendientes.has('ajustes:' + aj.id) && aj.updatedAt > local.ajustes.updatedAt) cambios.ajustes = aj;
    if (!Object.keys(cambios).length) return;
    await db.transaction('rw', [db.productos, db.precios, db.platos, db.producciones, db.ajustes], async () => {
      if (cambios.productos) await db.productos.bulkPut(cambios.productos);
      if (cambios.precios) await db.precios.bulkPut(cambios.precios);
      if (cambios.platos) await db.platos.bulkPut(cambios.platos);
      if (cambios.producciones) await db.producciones.bulkPut(cambios.producciones);
      if (cambios.ajustes) await db.ajustes.put(cambios.ajustes);
    });
    this.poner({ todo: aplicar(this.estado.todo, cambios) });
  }

  /** Comprueba una clave con el Apps Script y la guarda en este dispositivo. */
  async entrar(clave: string): Promise<'ok' | 'clave' | 'red'> {
    try {
      await llamar(clave, 'comprobar');
    } catch (e) {
      return e instanceof ErrorClave ? 'clave' : 'red';
    }
    try { localStorage.setItem(CLAVE_LS, clave); localStorage.removeItem(SALIO_LS); } catch { /* sin almacenamiento */ }
    await this.sincronizar(clave);
    this.poner({ clave, errorClave: false });
    return 'ok';
  }

  /** La clave ya no vale (se cambió en otro dispositivo): se pide otra vez sin perder lo pendiente. */
  olvidarClave() {
    try { localStorage.removeItem(CLAVE_LS); } catch { /* sin almacenamiento */ }
    this.poner({ clave: null, errorClave: true });
  }

  /** Cambia la clave en el Apps Script. Los demás dispositivos tendrán que escribirla otra vez. */
  async cambiarClave(nueva: string): Promise<'ok' | 'red' | 'error'> {
    const clave = this.estado.clave;
    if (!clave) return 'error';
    try {
      await llamar(clave, 'cambiarClave', { nueva });
    } catch (e) {
      return e instanceof ErrorRed ? 'red' : 'error';
    }
    try { localStorage.setItem(CLAVE_LS, nueva); } catch { /* sin almacenamiento */ }
    this.poner({ clave: nueva });
    return 'ok';
  }

  /** Cambios guardados en el dispositivo que todavía no se han subido. */
  pendientes(): Promise<number> {
    return db.cola.count();
  }

  /** Borra la clave y la copia local (no los datos de la hoja). */
  async cerrarSesion() {
    try { localStorage.removeItem(CLAVE_LS); localStorage.setItem(SALIO_LS, '1'); } catch { /* sin almacenamiento */ }
    await Promise.all([db.productos.clear(), db.precios.clear(), db.platos.clear(), db.producciones.clear(), db.ajustes.clear(), db.cola.clear(), db.meta.clear()]);
    this.poner({ clave: null, errorClave: false, sync: 'guardado', todo: VACIO });
  }

  async leerMeta<T>(k: string): Promise<T | undefined> {
    return (await db.meta.get(k))?.v as T | undefined;
  }

  async ponerMeta(k: string, v: unknown) {
    if (v === undefined) await db.meta.delete(k);
    else await db.meta.put({ k, v });
  }
}

export const almacen = new Almacen();

export function useApp(): Estado {
  return useSyncExternalStore(almacen.suscribir, almacen.get);
}
