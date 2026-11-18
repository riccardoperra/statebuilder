import { defineConfig } from 'vitest/config';
import solidPlugin from '@solidjs/vite-plugin';

// The plugin makes the tests run on the client build of Solid, the one with
// deferred writes. Node alone would resolve the server build.
export default defineConfig({
  test: { environment: 'jsdom' },
  plugins: [solidPlugin()],
});
