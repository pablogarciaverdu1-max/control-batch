// Fechas en formato AAAA-MM-DD (día local) y sus textos en español.

export function iso(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${dia}`;
}

export function deIso(f: string): Date {
  const [a, m, d] = f.split('-').map(Number);
  return new Date(a, (m || 1) - 1, d || 1);
}

export function hoyIso(ahora = new Date()): string {
  return iso(ahora);
}

export function ayerIso(ahora = new Date()): string {
  const d = new Date(ahora);
  d.setDate(d.getDate() - 1);
  return iso(d);
}

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** "Domingo, 11 de octubre" */
export function fechaLarga(f: string): string {
  const d = deIso(f);
  return cap(DIAS[d.getDay()]) + ', ' + d.getDate() + ' de ' + MESES[d.getMonth()];
}

/** "Dom 11 oct" */
export function fechaCorta(f: string): string {
  const d = deIso(f);
  return DIAS_CORTOS[d.getDay()] + ' ' + d.getDate() + ' ' + MESES_CORTOS[d.getMonth()];
}

/** "11 oct 2026" */
export function fechaConAnio(f: string): string {
  const d = deIso(f);
  return d.getDate() + ' ' + MESES_CORTOS[d.getMonth()] + ' ' + d.getFullYear();
}

/** "Hoy, 11 oct 2026", "Ayer, 10 oct 2026" o "Mié 7 oct 2026" */
export function fechaRelativa(f: string, ahora = new Date()): string {
  if (f === hoyIso(ahora)) return 'Hoy, ' + fechaConAnio(f);
  if (f === ayerIso(ahora)) return 'Ayer, ' + fechaConAnio(f);
  return fechaCorta(f) + ' ' + deIso(f).getFullYear();
}

/** "11 oct" para etiquetas de gráficas */
export function diaMes(f: string): string {
  const d = deIso(f);
  return d.getDate() + ' ' + MESES_CORTOS[d.getMonth()];
}
