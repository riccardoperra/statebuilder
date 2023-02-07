import {
  ApiDefinitionCreator,
  GenericStoreApi,
  Plugin,
  PluginContext,
  PluginCreatorFunction,
  StoreApiDefinition,
} from '~/types';

export const $CREATOR = Symbol('store-creator-api'),
  $NAME = Symbol('store-state-name'),
  $EXTENSION = Symbol('store-state-extension'),
  $PLUGIN = Symbol('store-plugin');

/**
 * A factory function that creates a store API definition creator.
 *
 * @param name - The name of the store API definition.
 * @param creator - The function that creates the store API instance.
 * @returns A store API definition creator that takes arguments to be passed to the store API instance creator and returns a store API definition object.
 */
export function create<P extends any[], T extends GenericStoreApi>(
  name: string,
  creator: (...args: P) => T,
): (...args: P) => ApiDefinitionCreator<T> {
  let id = 0;
  return (...args) => {
    let customPluginId = 0;
    const resolvedName = `${name}-${++id}`,
      extensions: Array<Plugin<any, any>> = [];

    const apiDefinition: ApiDefinitionCreator<T> = {
      [$NAME]: resolvedName,
      [$EXTENSION]: extensions,
      [$CREATOR]: () => creator(...args),

      extend(createPlugin: any) {
        if (
          typeof createPlugin === 'function' &&
          !createPlugin.hasOwnProperty($PLUGIN)
        ) {
          extensions.push({
            name: `custom-${++customPluginId}`,
            apply: createPlugin,
          });
        } else {
          extensions.push(createPlugin);
        }
        return this as any;
      },
    };

    return apiDefinition;
  };
}

function checkDependencies(
  resolvedPlugins: string[],
  plugin: Plugin<GenericStoreApi, any>,
) {
  const meta = plugin[$PLUGIN];
  if (!meta) return;

  const { dependencies } = meta;
  if (!dependencies) return;

  dependencies.forEach((dependency) => {
    if (!resolvedPlugins.includes(dependency)) {
      throw new Error(
        `[statebuilder] The dependency '${dependency}' of plugin '${meta.name}' is missing`,
        { cause: { resolvedDependencies: resolvedPlugins, plugin } },
      );
    }
  });
}

/**
 * A function that resolves a store API definition by applying the provided extensions to it.
 *
 * @template TDefinition - The type of the store API definition.
 * @param definition - The store API definition to resolve.
 * @returns The resolved store API with all the extensions applied.
 */
export function resolve<
  TDefinition extends StoreApiDefinition<GenericStoreApi, Record<string, any>>,
>(definition: TDefinition) {
  const storeApi = definition[$CREATOR](),
    extensions = definition[$EXTENSION];

  const resolvedPlugins: string[] = [];
  const pluginContext: PluginContext = {
    plugins: extensions,
    metadata: new Map<string, unknown>(),
  };

  pluginContext.metadata.set('core/resolvedPlugins', resolvedPlugins);

  for (const extensionCreator of extensions) {
    const createExtension =
      typeof extensionCreator === 'function'
        ? extensionCreator(storeApi)
        : extensionCreator;

    checkDependencies(resolvedPlugins, extensionCreator);

    const resolvedContext = createExtension.apply(storeApi, pluginContext);

    if (!resolvedContext) continue;
    // We should avoid Object.assign in order to not override accessor and have
    // full control of the property for future Plugin updates
    for (const p in resolvedContext) {
      if (p === 'set' && typeof resolvedContext[p] !== 'function') continue;
      storeApi[p as keyof typeof storeApi] = resolvedContext[p];
    }

    resolvedPlugins.push(extensionCreator.name);
  }

  return storeApi;
}

type PluginCallback<S extends GenericStoreApi, R> = (
  storeApi: S,
  context?: PluginContext,
) => R;

type PluginCreatorOptions = {
  name: string;
  dependencies?: string[];
};

/**
 * A function that creates a plugin for a generic store API.
 *
 * @template TStore - The type of the store API that this plugin is for.
 * @template Extension - The type of the extension that this plugin adds to the store.
 * @param pluginCallback - The function that will be called when the plugin is applied.
 * @param options - The options for creating the plugin.
 * @returns A plugin object with the given name and dependencies and the apply function provided.
 */
export function makePlugin<TStore extends GenericStoreApi, Extension>(
  pluginCallback: PluginCallback<TStore, Extension>,
  options: PluginCreatorOptions,
): Plugin<TStore, Extension> {
  return {
    [$PLUGIN]: {
      name: options.name,
      dependencies: options.dependencies ?? [],
    },
    apply: pluginCallback,
    name: options.name,
  } as any;
}

export function withPlugin<
  Api extends GenericStoreApi,
  R extends Plugin<Api, any>,
>(withPluginCallback: (store: Api) => R): PluginCreatorFunction<Api, R> {
  Object.defineProperty(withPluginCallback, $PLUGIN, {
    value: true,
  });

  return withPluginCallback as PluginCreatorFunction<Api, R>;
}
