// Junta la versión de prueba (dist-demo) en un único HTML para publicarla como página.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
const dir = new URL('../dist-demo/', import.meta.url);
const html = readFileSync(new URL('index.html', dir), 'utf8');
const js = readdirSync(new URL('assets/', dir)).filter((f) => f.endsWith('.js'));
if (js.length !== 1) throw new Error('Se esperaba un solo JS: ' + js);
const codigo = readFileSync(new URL('assets/' + js[0], dir), 'utf8').replace(/<\/script/gi, '<\\/script');
const head = html.match(/<head>([\s\S]*)<\/head>/)[1]
  .replace(/<meta charset[^>]*>|<meta name="viewport"[^>]*>/g, '')
  .replace(/<script type="module"[^>]*><\/script>/, '');
const salida = process.argv[2];
writeFileSync(salida, head.trim() + '\n<div id="root"></div>\n<script type="module">\n' + codigo + '\n</script>\n');
console.log('ok', salida, Math.round((codigo.length) / 1024) + ' KB');
