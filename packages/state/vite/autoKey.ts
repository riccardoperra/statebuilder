import { Plugin } from 'vite';
import { astAddAutoNaming } from './internal/astAutoNaming';
import { parseModule } from 'magicast';

interface StatebuilderAutonamingOptions {
  transformStores: string[];
}
export function autoKey(options: StatebuilderAutonamingOptions): Plugin {
  const { transformStores } = options;
  return {
    name: 'statebuilder:autokey',
    transform(code, id, options) {
      if (!code.includes('statebuilder')) {
        return;
      }
      const findStoresTransformRegexp = new RegExp(transformStores.join('|'));
      if (findStoresTransformRegexp.test(code)) {
        const module = parseModule(code);
        const result = astAddAutoNaming(module.$ast, (functionName) =>
          transformStores.includes(functionName),
        );
        if (result) {
          return module.generate();
        }
      }
    },
  };
}
