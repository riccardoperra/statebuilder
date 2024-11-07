import { defineConfig } from '@solidjs/start/config';
import { statebuilder } from 'statebuilder/compiler';

export default defineConfig({
  vite: {
    plugins: [
      statebuilder({
        autoKey: true,
        experimental: {
          transformStateProviderDirective: true,
        },
      }),
    ],
  },
});
