import { defineConfig } from 'vitest/config';
import solidPlugin from 'vite-plugin-solid';
import { statebuilder } from './compiler';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
  },
  resolve: { tsconfigPaths: true },
  plugins: [
    solidPlugin(),
    statebuilder({
      autoKey: false,
      dev: true,
      experimental: {
        transformStateProviderDirective: true,
      },
    }),
  ],
});
