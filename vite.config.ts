/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// La app vive en https://pablogarciaverdu1-max.github.io/control-batch/
const BASE = '/control-batch/';

/**
 * En `npm run dev` sin VITE_API_URL, responde en /control-batch/api-falsa
 * con el mismo Code.gs ejecutado sobre una hoja falsa en memoria (clave 1234).
 */
function apiFalsa(): Plugin {
  return {
    name: 'api-falsa',
    apply: 'serve',
    async configureServer(server) {
      const { crearSimulador } = await import('./apps-script/simulador');
      const sim = crearSimulador('1234');
      server.middlewares.use(BASE + 'api-falsa', (req, res) => {
        let cuerpo = '';
        req.on('data', (c) => (cuerpo += c));
        req.on('end', () => {
          const texto = req.method === 'POST' ? sim.post(cuerpo) : sim.get();
          setTimeout(() => {
            res.setHeader('Content-Type', 'application/json');
            res.end(texto);
          }, 400);
        });
      });
    },
  };
}

/** `import f from './Code.gs?fabrica'` da una función que ejecuta Code.gs sin usar eval. */
function fabricaGs(): Plugin {
  return {
    name: 'fabrica-gs',
    enforce: 'pre',
    async resolveId(id, importer) {
      if (!id.endsWith('.gs?fabrica')) return null;
      const r = await this.resolve(id.replace('?fabrica', ''), importer);
      return r ? '\0' + r.id + '?fabrica' : null;
    },
    async load(id) {
      if (!id.startsWith('\0') || !id.endsWith('?fabrica')) return null;
      const { readFile } = await import('node:fs/promises');
      const codigo = await readFile(id.slice(1, -'?fabrica'.length), 'utf8');
      return 'export default function (SpreadsheetApp, PropertiesService, LockService, ContentService) {\n' + codigo + '\nreturn { doPost: doPost, doGet: doGet };\n}';
    },
  };
}

export default defineConfig(({ mode }) => ({
  base: BASE,
  plugins: [react(), apiFalsa(), fabricaGs()],
  // La versión de prueba va en un solo archivo JS
  build: mode === 'demo' ? { rollupOptions: { output: { inlineDynamicImports: true } } } : {},
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
}));
