import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig({
  plugins: [vue(), cssInjectedByJsPlugin()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    target: 'esnext',
    lib: {
      entry: 'src/main.ts',
      formats: ['system'],
      fileName: () => 'mfe-table.js',
    },
    rollupOptions: {
      external: [],
    },
  },
  server: {
    port: 9001,
  },
  preview: {
    port: 9001,
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
