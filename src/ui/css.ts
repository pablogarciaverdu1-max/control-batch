import type { CSSProperties } from 'react';

const cache = new Map<string, CSSProperties>();

/**
 * Convierte un estilo escrito como en el diseño ("display: flex; gap: 8px")
 * en un objeto de estilo de React. Así se copian los estilos del .dc.html tal cual.
 */
export function s(texto: string): CSSProperties {
  let r = cache.get(texto);
  if (!r) {
    const o: Record<string, string> = {};
    for (const decl of texto.split(';')) {
      const i = decl.indexOf(':');
      if (i < 0) continue;
      const k = decl.slice(0, i).trim();
      const v = decl.slice(i + 1).trim();
      if (!k) continue;
      o[k.startsWith('--') ? k : k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = v;
    }
    r = o as CSSProperties;
    cache.set(texto, r);
  }
  return r;
}
