import { defineConfig } from 'vitest/config';
import solidPlugin from '@solidjs/vite-plugin';

export default defineConfig({
  test: {
    environment: 'happy-dom',
  },
  plugins: [solidPlugin()],
});
