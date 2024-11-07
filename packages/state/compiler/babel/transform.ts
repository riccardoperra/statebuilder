import * as babel from '@babel/core';
import { basename } from 'node:path';

export function transformAsync(
  moduleId: string,
  code: string,
  customPlugins: babel.TransformOptions['plugins'],
) {
  const plugins: NonNullable<
    NonNullable<babel.TransformOptions['parserOpts']>['plugins']
  > = ['jsx'];
  if (/\.[mc]?tsx?$/i.test(moduleId)) {
    plugins.push('typescript');
  }
  return babel.transformAsync(code, {
    plugins: customPlugins,
    parserOpts: {
      plugins,
    },
    filename: basename(moduleId),
    ast: false,
    sourceMaps: true,
    configFile: false,
    babelrc: false,
    sourceFileName: moduleId,
  });
}
