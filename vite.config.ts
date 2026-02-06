import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      'bonk-engine': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    target: 'ES2022',
    sourcemap: true,
  },
  server: {
    port: 3000,
    strictPort: true,
  },
});
