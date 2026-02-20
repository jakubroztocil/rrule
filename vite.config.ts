import { resolve } from 'node:path';
import dts from 'unplugin-dts/vite';
import { defineConfig } from 'vite';

const __dirname = import.meta.dirname;

export default defineConfig({
  plugins: [
    dts({
      outDirs: ['dist'],
      insertTypesEntry: true,
      bundleTypes: true,
      exclude: ['vite.config.ts', 'test'],
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      fileName: 'rrule',
      formats: ['es', 'cjs'],
    },
    sourcemap: true,
    minify: 'terser',
  },
});
