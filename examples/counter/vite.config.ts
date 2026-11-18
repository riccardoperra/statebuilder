import solid from '@solidjs/vite-plugin';
import { statebuilder } from 'statebuilder/compiler';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [statebuilder({ autoKey: true }), solid()],
});
