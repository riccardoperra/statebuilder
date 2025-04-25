import { defineConfig } from 'vitest/config';
import solidPlugin from 'vite-plugin-solid';
import tsconfigPaths from 'vite-tsconfig-paths';
import { statebuilder } from './compiler';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
  },
  plugins: [
    solidPlugin(),
    tsconfigPaths(),
    statebuilder({
      autoKey: false,
      dev: true,
      experimental: {
        transformStateProviderDirective: true,
      },
    }),
  ],
});
