import { Plugin } from 'vite';
import { ConsolaInstance, createConsola } from 'consola';
import { colors } from 'consola/utils';
import { autoKey } from './autoKey';
import { stateProviderDirective } from './stateProviderDirective';

export interface StateBuilderPluginOptions {
  /**
   * Enables dev mode.
   * @default true when running `dev` command.
   * @default false when running `build` command.
   */
  dev?: boolean;
  /**
   * If true, generates the key valued as the variable declaration name.
   */
  autoKey?: boolean;
  /**
   * A set of custom primitives to be included into the plugin transform processor
   */
  transformStores?: string[];
  /**
   * Experimental features
   */
  experimental?: {
    /**
     * Transform components that make use of 'use stateprovider'.
     */
    transformStateProviderDirective?: boolean;
  };
}

export function statebuilder(options?: StateBuilderPluginOptions): Plugin[] {
  const consola = createConsola();

  const defaultTransformStores = ['defineStore', 'defineSignal'];
  const transformStores = [
    ...defaultTransformStores,
    ...(options?.transformStores ?? []),
  ];

  let isDev: boolean = false;
  const plugins: Plugin[] = [];

  plugins.push({
    name: 'statebuilder:config',
    enforce: 'pre',
    config(userConfig, { command }) {
      isDev = options?.dev ?? command === 'serve';
      return {
        define: {
          __STATEBUILDER_DEV__: isDev,
        },
        plugins,
      };
    },
    configResolved() {
      consola.log('\n');
      consola.log(`${logPrefix()}`);
      logProperties(consola, [
        ['mode', isDev ? 'DEV' : 'PROD', colors.magenta],
        ['autoKey', options?.autoKey ?? false, colors.blue],
        [
          'ɵtransformStateProviderDirective',
          options?.experimental?.transformStateProviderDirective ?? false,
          colors.yellow,
        ],
      ]);
    },
  });

  if (options?.autoKey) {
    plugins.push(autoKey({ transformStores }));
  }

  if (options?.experimental?.transformStateProviderDirective) {
    plugins.push(stateProviderDirective());
  }

  return plugins;
}

function logPrefix() {
  return colors.bgBlueBright(' StateBuilder ');
}

function logProperties(
  consola: ConsolaInstance,
  entries: ReadonlyArray<
    [key: string, value: any, modifier: (s: any) => string]
  >,
) {
  const lenghts = entries.map(([key]) => key.length);
  const maxLength = Math.max(...lenghts);
  const padding = maxLength + 2;
  for (const [key, value, modifier] of entries) {
    const space = new Array(padding - key.length).fill(' ');
    consola.log(`${modifier(key)}${space.join('')}`, value);
  }
}
