import {
  ApiDefinitionCreator,
  GenericStoreApi,
  Plugin,
  PluginContext,
  PluginOf,
  StoreApiDefinition,
} from '~/types';
import { onCleanup } from 'solid-js';
import { ApiDefinition } from '~/api-definition';
import { Container } from '~/container';
import { ResolvedPluginContext } from '~/resolved-plugin-context';

export const $CREATOR = Symbol('store-creator-api'),
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
    const resolvedName = `${name}-${++id}`;
    return new ApiDefinition<T, {}>(resolvedName, id, () => creator(...args));
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
 * @param container - The StateContainer in the plugin context.
 * @returns The resolved store API with all the extensions applied.
 */
export function resolve<
  TDefinition extends StoreApiDefinition<GenericStoreApi, Record<string, any>>,
>(definition: TDefinition, container?: Container) {
  const api = definition[$CREATOR];

  const { factory, plugins } = api;

  const resolvedPlugins: string[] = [],
    pluginContext = new ResolvedPluginContext(container, plugins),
    resolvedStore = factory();

  for (const extensionCreator of plugins) {
    const createExtension =
      typeof extensionCreator === 'function'
        ? extensionCreator(resolvedStore)
        : extensionCreator;

    checkDependencies(resolvedPlugins, extensionCreator);

    const resolvedContext = createExtension.apply(resolvedStore, pluginContext);

    if (!resolvedContext) continue;
    // We should avoid Object.assign in order to not override accessor and have
    // full control of the property for future Plugin updates
    for (const p in resolvedContext) {
      if (p === 'set' && typeof resolvedContext[p] !== 'function') continue;
      resolvedStore[p as keyof typeof resolvedStore] = resolvedContext[p];
    }

    resolvedPlugins.push(extensionCreator.name);
  }

  if (!!container) {
    pluginContext.hooks.onDestroy(() => container.remove(definition));
  }

  pluginContext.runInitSubscriptions(resolvedStore);
  onCleanup(() => pluginContext.runDestroySubscriptions(resolvedStore));

  return resolvedStore;
}

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
function _makePlugin<
  TCallback extends <S extends GenericStoreApi>(
    store: S,
    context: PluginContext<S>,
  ) => unknown,
>(
  pluginCallback: TCallback,
  options: PluginCreatorOptions,
): PluginOf<TCallback> {
  const pluginFactory: () => Plugin<any, any> = () => ({
    [$PLUGIN]: {
      name: options.name,
      dependencies: options.dependencies ?? [],
      apply: pluginCallback,
    },
    apply: pluginCallback,
    name: options.name,
  });

  Object.defineProperties(pluginFactory, {
    [$PLUGIN]: {
      value: {
        name: options.name,
        dependencies: options.dependencies ?? [],
      },
    },
    name: { value: options.name },
  });

  return pluginFactory as unknown as TCallback;
}

export const makePlugin = Object.assign(_makePlugin, {
  typed<T extends GenericStoreApi>() {
    return function _makePlugin2<
      TCallback extends <S extends T>(store: S) => unknown,
    >(cb: TCallback, options: PluginCreatorOptions): TCallback {
      return _makePlugin(cb as any, options);
    };
  },
});
