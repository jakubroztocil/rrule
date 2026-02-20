import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const __dirname = import.meta.dirname;

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      fileName: 'rrule-rebuild',
      formats: ['es', 'cjs'],
    },
    sourcemap: true,
    minify: 'terser',
  },
});
