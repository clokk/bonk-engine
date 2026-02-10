import { defineConfig } from 'vite';
import path from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig(({ command }) => {
  const shared = {
    resolve: {
      alias: {
        'bonkjs': path.resolve(__dirname, 'src'),
      },
    },
  };

  if (command === 'serve') {
    return {
      ...shared,
      server: {
        port: 3000,
        strictPort: true,
      },
    };
  }

  // build — library mode
  return {
    ...shared,
    build: {
      lib: {
        entry: path.resolve(__dirname, 'src/index.ts'),
        formats: ['es'],
        fileName: 'bonkjs',
      },
      rollupOptions: {
        external: ['pixi.js'],
      },
      target: 'ES2022',
      sourcemap: true,
    },
    plugins: [
      dts({ tsconfigPath: './tsconfig.build.json' }),
    ],
  };
});
