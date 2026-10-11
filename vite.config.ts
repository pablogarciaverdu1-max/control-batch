/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

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
            res.setHeader('Access-Control-Allow-Origin', '*'); // como Apps Script
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
  plugins: [
    react(),
    apiFalsa(),
    fabricaGs(),
    // App instalable y que arranca sin conexión. No va en la versión de prueba (página única).
    mode !== 'demo' && VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'Mi cocina',
        short_name: 'Mi cocina',
        description: 'Costes de batch cooking: compras, platos y producciones.',
        lang: 'es',
        // Rutas relativas a la base (/control-batch/)
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#14213D',
        theme_color: '#14213D',
        icons: [
          { src: 'icono-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icono-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icono-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg}'],
        navigateFallback: BASE + 'index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
            handler: 'CacheFirst',
            options: { cacheName: 'tipografias', expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }, cacheableResponse: { statuses: [0, 200] } },
          },
        ],
      },
    }),
  ],
  // La versión de prueba va en un solo archivo JS
  build: mode === 'demo' ? { rollupOptions: { output: { inlineDynamicImports: true } } } : { chunkSizeWarningLimit: 800 },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
}));
