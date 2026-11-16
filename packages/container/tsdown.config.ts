import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['./src/index.ts'],
  format: 'esm',
  platform: 'neutral',
  sourcemap: true,
  dts: true,
});
