// Genera los iconos PNG de la app (olla del logo sobre naranja) en public/.
import { chromium } from 'playwright';
const olla = (tam, trazo) => `<svg xmlns="http://www.w3.org/2000/svg" width="${tam}" height="${tam}" viewBox="0 0 24 24" fill="none" stroke="#14213D" stroke-width="${trazo}" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h16v7a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z"/><path d="M2 10h20"/><path d="M9 6c0-1 1-1 1-2M14 6c0-1 1-1 1-2"/></svg>`;
const iconos = [
  // [archivo, tamaño, radio de las esquinas (0 = cuadrado para "maskable"), tamaño de la olla]
  ['icono-192.png', 192, 0.3, 0.56],
  ['icono-512.png', 512, 0.3, 0.56],
  ['icono-maskable-512.png', 512, 0, 0.44],
  ['apple-touch-icon.png', 180, 0, 0.56],
];
const nav = await chromium.launch();
const p = await nav.newPage();
for (const [archivo, t, radio, olla_] of iconos) {
  await p.setViewportSize({ width: t, height: t });
  await p.setContent(`<html><body style="margin:0;background:transparent"><div style="width:${t}px;height:${t}px;border-radius:${radio * t}px;background:#FF9F1C;display:flex;align-items:center;justify-content:center">${olla(Math.round(t * olla_), 2)}</div></body></html>`);
  await p.screenshot({ path: new URL('../public/' + archivo, import.meta.url).pathname, omitBackground: true });
}
await nav.close();
console.log('ok');
