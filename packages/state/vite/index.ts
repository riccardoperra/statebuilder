import { Plugin } from 'vite';
import { createConsola } from 'consola';
import { colors } from 'consola/utils';

export interface StateBuilderPluginOptions {
  /**
   * Enables dev mode.
   * @default true when running `dev` command.
   * @default false when running `build` command.
   */
  dev?: boolean;
}

function logPrefix() {
  return colors.bgBlueBright(' StateBuilder ');
}

export function statebuilder(options?: StateBuilderPluginOptions): Plugin {
  const consola = createConsola();
  let isDev: boolean = false;

  return {
    name: 'statebuilder-config',
    config(userConfig, { command }) {
      isDev = options?.dev ?? command === 'serve';
      return {
        define: {
          __STATEBUILDER_DEV__: isDev,
        },
      };
    },
    configResolved() {
      consola.log('\n');
      consola.log(`${logPrefix()}`);
      consola.log(` ${colors.magenta(`mode`)}   ${isDev ? 'DEV' : 'PROD'}`);
    },
  };
}
