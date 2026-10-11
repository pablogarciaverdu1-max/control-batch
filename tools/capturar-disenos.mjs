// Uso: node tools/capturar-disenos.mjs <carpeta-salida> [Pantalla ...]
import { chromium } from 'playwright';
import { readdirSync, mkdirSync } from 'node:fs';
import { servir } from './servidor-estatico.mjs';
const [salida, ...solo] = process.argv.slice(2);
mkdirSync(salida, { recursive: true });
const srv = await servir(5179);
const nav = await chromium.launch();
const archivos = readdirSync(new URL('../diseno', import.meta.url)).filter((f) => f.endsWith('.dc.html')).map((f) => f.replace('.dc.html', ''));
for (const f of archivos.filter((f) => !solo.length || solo.includes(f))) {
  const desktop = /Desktop/.test(f);
  const page = await nav.newPage({ viewport: desktop ? { width: 1280, height: 900 } : { width: 390, height: 844 } });
  page.on('pageerror', (e) => console.log(f, 'ERROR', e.message));
  await page.goto('http://localhost:5179/tools/dc-render.html?f=' + f);
  await page.waitForSelector('body[data-listo]', { timeout: 15000 }).catch(() => console.log(f, 'sin terminar'));
  await page.screenshot({ path: `${salida}/${f}.png`, fullPage: desktop });
  await page.close();
}
await nav.close(); srv.close();
console.log('ok');
