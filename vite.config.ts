import { defineConfig } from 'vite';
import { bonkScenes } from './tools/vite-plugin-bonk-scenes';
import path from 'path';

export default defineConfig({
  plugins: [bonkScenes()],
  resolve: {
    alias: {
      '@engine': path.resolve(__dirname, 'src/engine'),
      '@behaviors': path.resolve(__dirname, 'behaviors'),
    },
  },
  build: {
    target: 'ES2022',
    sourcemap: true,
  },
  server: {
    port: 3000,
  },
});
