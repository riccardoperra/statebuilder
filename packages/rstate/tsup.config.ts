import {defineConfig} from "tsup";

export default defineConfig(options => {
  return {
    entry: ["src/index.ts"],
    format: ['esm', 'cjs'],
    clean: true,
    sourcemap: true,
    minify: !options.watch,
    dts: true,
    splitting: true
  }
});
