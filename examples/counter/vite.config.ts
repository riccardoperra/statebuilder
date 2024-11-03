import solid from 'solid-start/vite';
import { defineConfig } from 'vite';
import { statebuilder } from 'statebuilder/vite';

export default defineConfig({
  plugins: [solid({ ssr: false }), statebuilder({ dev: true, autoKey: true })],
});
