import {
  ApiDefinitionCreator,
  GenericStoreApi,
  Plugin,
  PluginContext,
  StoreApiDefinition,
} from '~/types';

export const $CREATOR = Symbol('store-creator-api'),
  $NAME = Symbol('store-state-name'),
  $EXTENSION = Symbol('store-state-extension'),
  $PLUGIN = Symbol('store-plugin');

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
        if (typeof createPlugin === 'function') {
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

export function resolve<
  TDefinition extends StoreApiDefinition<
    GenericStoreApi<any, (...args: any) => any>,
    Record<string, any>
  >,
>(definition: TDefinition) {
  const storeApi = definition[$CREATOR](),
    extensions = definition[$EXTENSION];

  const pluginContext: PluginContext = {
    plugins: extensions,
    metadata: new Map<string, unknown>(),
  };

  for (const createExtension of extensions) {
    const resolvedContext = createExtension.apply(storeApi, pluginContext);
    if (!resolvedContext) continue;
    // We should avoid Object.assign in order to not override accessor and have
    // full control of the property for future Plugin updates
    for (const p in resolvedContext) {
      if (p === 'set' && typeof resolvedContext[p] !== 'function') continue;
      storeApi[p as keyof typeof storeApi] = resolvedContext[p];
    }
  }

  return storeApi;
}

type PluginCallback<S, R> = (storeApi: S, context?: PluginContext) => R;

export function makePlugin<
  TStore extends GenericStoreApi<any, any>,
  TE,
  T extends PluginCallback<TStore, TE>,
>(
  pluginCallback: PluginCallback<TStore, TE>,
  options: { name: string },
): Plugin<TStore, TE> {
  return {
    [$PLUGIN]: true,
    apply: pluginCallback,
    name: options.name,
  };
}
