import { defineConfig } from 'tsup';

export default defineConfig((options) => {
  return [
    {
      entry: {
        index: 'src/index.ts',
        'plugins/asyncAction': 'src/plugins/asyncAction.ts',
        'plugins/commands': 'src/plugins/commands/index.ts',
        'plugins/devtools': 'src/plugins/devtools/index.ts',
        'plugins/reducer': 'src/plugins/reducer/index.ts',
      },
      format: ['esm'],
      treeshake: 'smallest',
      external: [
        'solid-js',
        'solid-js/web',
        'solid-js/store',
        'rxjs',
        '@solid-primitives/event-bus',
        '@solid-primitives/utils',
      ],
      sourcemap: true,
      minify: false,
      dts: true,
      splitting: true,
    },
    {
      entry: ['./vite/index.ts'],
      outDir: './dist/vite',
      format: 'esm',
      platform: 'node',
      dts: true,
    },
  ];
});
