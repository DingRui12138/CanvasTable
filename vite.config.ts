import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'CanvasTable',
      fileName: 'canvas-table',
    },
    sourcemap: true,
    rollupOptions: {
      output: {
        globals: {},
      },
    },
  },
  server: {
    port: 3000,
    open: '/examples/basic.html',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
