// Núcleo del simulador del Apps Script: ejecuta Code.gs con una hoja falsa.
// No depende de Node, así sirve para los tests y para la versión de prueba en el navegador.

type Celda = string | number | boolean | Date | null;

export class HojaFalsa {
  celdas: Celda[][] = [];
  formatos: string[][] = [];
  constructor(public nombre: string) {}
  getLastRow() {
    for (let r = this.celdas.length - 1; r >= 0; r--) if (this.celdas[r].some((v) => v !== '' && v !== null && v !== undefined)) return r + 1;
    return 0;
  }
  setFrozenRows() {}
  getRange(fila: number, col: number, nf = 1, nc = 1) {
    const hoja = this;
    const asegurar = () => {
      while (hoja.celdas.length < fila - 1 + nf) { hoja.celdas.push([]); hoja.formatos.push([]); }
    };
    const rango = {
      getValues() {
        const out: Celda[][] = [];
        for (let r = 0; r < nf; r++) {
          const fila_ = hoja.celdas[fila - 1 + r] || [];
          const v: Celda[] = [];
          for (let c = 0; c < nc; c++) { const x = fila_[col - 1 + c]; v.push(x === undefined || x === null ? '' : x); }
          out.push(v);
        }
        return out;
      },
      setValues(vals: Celda[][]) {
        asegurar();
        vals.forEach((filaV, r) => filaV.forEach((v, c) => {
          const fmt = hoja.formatos[fila - 1 + r][col - 1 + c];
          // Como Google Sheets: un texto con forma de fecha se convierte en fecha salvo en formato texto.
          const conv = typeof v === 'string' && fmt !== '@' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(v) : v;
          hoja.celdas[fila - 1 + r][col - 1 + c] = conv;
        }));
        return rango;
      },
      setNumberFormats(f: string[][]) {
        asegurar();
        f.forEach((filaF, r) => filaF.forEach((x, c) => { hoja.formatos[fila - 1 + r][col - 1 + c] = x; }));
        return rango;
      },
      clearContent() {
        for (let r = 0; r < nf; r++) for (let c = 0; c < nc; c++) if (hoja.celdas[fila - 1 + r]) hoja.celdas[fila - 1 + r][col - 1 + c] = '';
        return rango;
      },
      setFontWeight() { return rango; },
    };
    return rango;
  }
}

export interface Simulador {
  /** Procesa un cuerpo de petición POST y devuelve el texto de la respuesta. */
  post(cuerpo: string): string;
  get(): string;
  hojas: Map<string, HojaFalsa>;
  propiedades: Map<string, string>;
}

export interface EstadoGuardado {
  hojas: { nombre: string; celdas: Celda[][]; formatos: string[][] }[];
  propiedades: [string, string][];
}

export type Fabrica = (...servicios: unknown[]) => { doPost: (e: unknown) => { texto: string }; doGet: () => { texto: string } };

export function crearSimuladorDesde(codigo: string | Fabrica, clave: string | null, previo?: EstadoGuardado, alCambiar?: (e: EstadoGuardado) => void): Simulador {
  const hojas = new Map<string, HojaFalsa>();
  const propiedades = new Map<string, string>(previo?.propiedades ?? []);
  if (!previo && clave) propiedades.set('CLAVE', clave);
  for (const h of previo?.hojas ?? []) {
    const hf = new HojaFalsa(h.nombre);
    hf.celdas = h.celdas;
    hf.formatos = h.formatos;
    hojas.set(h.nombre, hf);
  }
  const libro = {
    getSheetByName: (n: string) => hojas.get(n) ?? null,
    insertSheet: (n: string) => { const h = new HojaFalsa(n); hojas.set(n, h); return h; },
  };
  const servicios = {
    SpreadsheetApp: { getActiveSpreadsheet: () => libro },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k: string) => propiedades.get(k) ?? null,
        setProperty: (k: string, v: string) => { propiedades.set(k, v); },
      }),
    },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput: (t: string) => ({ texto: t, setMimeType() { return this; } }),
    },
  };
  // Orden de los servicios: el mismo que usa el plugin 'fabrica' de vite.config.ts
  const fabrica = typeof codigo === 'function'
    ? codigo
    : (new Function('SpreadsheetApp', 'PropertiesService', 'LockService', 'ContentService', codigo + '\n;return { doPost: doPost, doGet: doGet };') as Fabrica);
  const api = fabrica(servicios.SpreadsheetApp, servicios.PropertiesService, servicios.LockService, servicios.ContentService);
  const guardar = () => alCambiar?.({
    hojas: [...hojas.values()].map((h) => ({ nombre: h.nombre, celdas: h.celdas, formatos: h.formatos })),
    propiedades: [...propiedades],
  });
  return {
    post: (cuerpo) => { const r = api.doPost({ postData: { contents: cuerpo } }).texto; guardar(); return r; },
    get: () => api.doGet().texto,
    hojas,
    propiedades,
  };
}
