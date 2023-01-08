import {
  ApiDefinitionCreator,
  GenericStoreApi,
  StoreApiDefinition,
} from '~/types';

export const $CREATOR = Symbol('store-creator-api');
export const $NAME = Symbol('store-state-name');
export const $EXTENSION = Symbol('store-state-extension');

export function create<P extends any[], T extends GenericStoreApi>(
  name: string,
  creator: (...args: P) => T,
): (...args: P) => ApiDefinitionCreator<T> {
  let id = 0;
  return (...args) => {
    const resolvedName = `${name}-${++id}`;
    const extensions: Array<(ctx: T) => any> = [];

    const apiDefinition: ApiDefinitionCreator<T> = {
      [$NAME]: resolvedName,
      [$EXTENSION]: extensions,
      [$CREATOR]: () => creator(...args),

      extend(createPlugin) {
        extensions.push(createPlugin);
        return this as any;
      },
    };

    return apiDefinition;
  };
}

export function resolve<
  TDefinition extends StoreApiDefinition<GenericStoreApi<any, any>, any>,
>(definition: TDefinition) {
  const storeApi = definition[$CREATOR](),
    extensions = definition[$EXTENSION];

  for (const createExtension of extensions) {
    const resolvedContext = createExtension(storeApi);
    if (!resolvedContext) continue;
    // We should avoid Object.assign in order to not override accessor and have
    // full control of the property for future Plugin updates
    for (const p in resolvedContext) {
      storeApi[p] = resolvedContext[p];
    }
  }

  return storeApi;
}
