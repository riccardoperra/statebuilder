import * as babel from '@babel/core';
import { basename } from 'node:path';
import { Plugin } from 'vite';
import { babelReplaceStateProviderDirective } from './babel/replaceStateProviderDirective';
import { transformAsync } from './babel/transform';

export function stateProviderDirective(): Plugin {
  return {
    name: 'statebuilder:stateprovider-directive',
    enforce: 'pre',
    async transform(code, id, options) {
      if (code.indexOf('use stateprovider') === -1) {
        return;
      }
      const result = await transformAsync(id, code, [
        [babelReplaceStateProviderDirective],
      ]);
      if (result) {
        console.log(result.code);
        return {
          code: result.code || '',
          map: result.map,
        };
      }
    },
  };
}
