import { Plugin } from 'vite';
import * as magicast from 'magicast';
import { Program, traverseFast } from '@babel/types';
import * as babel from '@babel/core';
import { basename } from 'node:path';
import * as t from '@babel/types';
import { babelReplaceStateProviderDirective } from './internal/replaceStateProviderDirective';

export function stateProviderDirective(): Plugin {
  return {
    name: 'statebuilder:stateprovider-directive',
    enforce: 'pre',
    async transform(code, id, options) {
      if (code.indexOf('use stateprovider') === -1) {
        return;
      }
      const plugins: NonNullable<
        NonNullable<babel.TransformOptions['parserOpts']>['plugins']
      > = ['jsx'];
      if (/\.[mc]?tsx?$/i.test(id)) {
        plugins.push('typescript');
      }

      const result = await babel.transformAsync(code, {
        plugins: [[babelReplaceStateProviderDirective]],
        parserOpts: {
          plugins,
        },
        filename: basename(id),
        ast: false,
        sourceMaps: true,
        configFile: false,
        babelrc: false,
        sourceFileName: id,
      });

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
