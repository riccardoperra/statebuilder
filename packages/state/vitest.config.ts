import { defineConfig } from 'vitest/config';
import solidPlugin from 'vite-plugin-solid';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    transformMode: { web: [/\.[jt]sx?$/] },
    // otherwise, solid would be loaded twice:
    deps: { registerNodeLoader: true },
    // if you have few tests, try commenting one
    // or both out to improve performance:
    threads: false,
    isolate: false,
  },
  plugins: [solidPlugin(), tsconfigPaths()],
});
