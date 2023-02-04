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
      format: ['esm', 'cjs'],
      treeshake: 'smallest',
      external: ['solid-js', 'solid-js/web', 'solid-js/store', 'rxjs'],
      clean: true,
      sourcemap: true,
      minify: false,
      dts: true,
      splitting: true,
    },
  ];
});
