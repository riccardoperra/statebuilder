import { defineConfig } from '@solidjs/start/config';
import { statebuilder } from 'statebuilder/vite';

export default defineConfig({
  vite: {
    plugins: [
      statebuilder({
        autoKey: true,
      }),
    ],
  },
});
