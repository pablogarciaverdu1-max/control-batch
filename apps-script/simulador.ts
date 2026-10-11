// Simulador del Apps Script para tests y para `npm run dev` sin Google.
// Carga Code.gs tal cual y le da versiones falsas de SpreadsheetApp,
// PropertiesService, LockService y ContentService.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

type Celda = string | number | boolean | Date | null;

class HojaFalsa {
  celdas: Celda[][] = [];
  formatos: string[][] = [];
  constructor(public nombre: string) {}
  getLastRow() {
    for (let r = this.celdas.length - 1; r >= 0; r--) if (this.celdas[r].some((v) => v !== '' && v !== null)) return r + 1;
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
          for (let c = 0; c < nc; c++) { const x = fila_[col - 1 + c]; v.push(x === undefined ? '' : x); }
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

export function crearSimulador(clave: string | null = '1234'): Simulador {
  const hojas = new Map<string, HojaFalsa>();
  const propiedades = new Map<string, string>();
  if (clave) propiedades.set('CLAVE', clave);
  const libro = {
    getSheetByName: (n: string) => hojas.get(n) ?? null,
    insertSheet: (n: string) => { const h = new HojaFalsa(n); hojas.set(n, h); return h; },
  };
  const sandbox: Record<string, unknown> = {
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
    JSON, Date, Number, String, Object, isNaN, parseFloat,
  };
  vm.createContext(sandbox);
  const ruta = fileURLToPath(new URL('./Code.gs', import.meta.url));
  vm.runInContext(readFileSync(ruta, 'utf8'), sandbox);
  const doPost = sandbox.doPost as (e: unknown) => { texto: string };
  const doGet = sandbox.doGet as () => { texto: string };
  return {
    post: (cuerpo) => doPost({ postData: { contents: cuerpo } }).texto,
    get: () => doGet().texto,
    hojas,
    propiedades,
  };
}
