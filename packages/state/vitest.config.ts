import { defineConfig } from 'vitest/config';
import solidPlugin from '@solidjs/vite-plugin';
import { statebuilder } from './compiler';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
  resolve: { tsconfigPaths: true },
  plugins: [
    solidPlugin(),
    statebuilder({
      autoKey: false,
      dev: true,
    }),
  ],
});
