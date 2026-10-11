// Compara capturas del diseño y de la app: genera una imagen lado a lado y el % de píxeles distintos.
// Uso desde otros scripts: import { comparar } from './comparar.mjs'
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { readFileSync, writeFileSync } from 'node:fs';

export function comparar(rutaA, rutaB, salida) {
  const a = PNG.sync.read(readFileSync(rutaA));
  const b = PNG.sync.read(readFileSync(rutaB));
  const w = Math.min(a.width, b.width), h = Math.min(a.height, b.height);
  const recorta = (img) => { const o = new PNG({ width: w, height: h }); PNG.bitblt(img, o, 0, 0, w, h, 0, 0); return o; };
  const ra = recorta(a), rb = recorta(b);
  const diff = new PNG({ width: w, height: h });
  const n = pixelmatch(ra.data, rb.data, diff.data, w, h, { threshold: 0.15 });
  const lado = new PNG({ width: w * 3 + 20, height: h });
  lado.data.fill(255);
  PNG.bitblt(ra, lado, 0, 0, w, h, 0, 0);
  PNG.bitblt(rb, lado, 0, 0, w, h, w + 10, 0);
  PNG.bitblt(diff, lado, 0, 0, w, h, w * 2 + 20, 0);
  writeFileSync(salida, PNG.sync.write(lado));
  return +(100 * n / (w * h)).toFixed(2);
}
