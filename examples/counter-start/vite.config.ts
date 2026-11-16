import { solidStart } from '@solidjs/start/config';
import { nitro } from 'nitro/vite';
import { statebuilder } from 'statebuilder/compiler';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    statebuilder({
      autoKey: true,
    }),
    solidStart(),
    nitro(),
  ],
});
