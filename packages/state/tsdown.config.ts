import { defineConfig } from 'tsdown';

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
      'plugins/asyncAction': 'src/plugins/asyncAction.ts',
      'plugins/commands': 'src/plugins/commands/index.ts',
      'plugins/devtools': 'src/plugins/devtools/index.ts',
      'plugins/reducer': 'src/plugins/reducer/index.ts',
    },
    format: 'esm',
    platform: 'neutral',
    sourcemap: true,
    dts: true,
  },
  {
    entry: { index: 'compiler/index.ts' },
    outDir: 'dist/compiler',
    format: 'esm',
    platform: 'node',
    fixedExtension: false,
    dts: true,
  },
]);
