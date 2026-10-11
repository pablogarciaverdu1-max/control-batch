// Servidor estático mínimo para las capturas del diseño.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
const raiz = new URL('..', import.meta.url).pathname;
const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css' };
export function servir(puerto) {
  const s = http.createServer(async (req, res) => {
    const ruta = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
    try { const b = await readFile(join(raiz, ruta)); res.writeHead(200, { 'Content-Type': tipos[extname(ruta)] || 'application/octet-stream' }); res.end(b); }
    catch { res.writeHead(404); res.end(); }
  });
  return new Promise((ok) => s.listen(puerto, () => ok(s)));
}
