/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// La app vive en https://pablogarciaverdu1-max.github.io/control-batch/
const BASE = '/control-batch/';

export default defineConfig({
  base: BASE,
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
