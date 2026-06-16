import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig({
  plugins: [react(), cssInjectedByJsPlugin()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    target: 'esnext',
    lib: {
      entry: 'src/main.tsx',
      formats: ['system'],
      fileName: () => 'mfe-diagram.js',
    },
    rollupOptions: {
      external: [],
    },
  },
  server: {
    port: 9002,
  },
  preview: {
    port: 9002,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
  },
});
