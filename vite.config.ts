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

export default defineConfig({
  base: BASE,
  plugins: [react(), apiFalsa()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
