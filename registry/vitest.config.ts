import { defineConfig } from 'vitest/config';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  test: {
    environment: 'happy-dom',
  },
  plugins: [solidPlugin()],
});
