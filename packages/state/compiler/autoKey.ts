import * as babel from '@babel/core';
import { basename } from 'node:path';
import { Plugin } from 'vite';
import {
  babelAstAddAutoNaming,
  BabelAstAddAutoNamingOptions,
} from './babel/astAutoNaming';
import { transformAsync } from './babel/transform';

interface StatebuilderAutonamingOptions {
  transformStores: string[];
}
export function autoKey(options: StatebuilderAutonamingOptions): Plugin {
  const { transformStores } = options;
  const findStoresTransformRegexp = new RegExp(transformStores.join('|'));
  return {
    name: 'statebuilder:autokey',
    async transform(code, id, options) {
      if (
        !code.includes('statebuilder') ||
        !findStoresTransformRegexp.test(code)
      ) {
        return;
      }
      const result = await transformAsync(id, code, [
        [
          babelAstAddAutoNaming,
          {
            filterStores: (functionName) =>
              transformStores.includes(functionName),
          } as BabelAstAddAutoNamingOptions,
        ],
      ]);

      if (!result) {
        return;
      }

      return {
        code: result.code ?? '',
        map: result.map,
      };
    },
  };
}
