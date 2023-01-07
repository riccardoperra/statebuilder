import { ApiDefinitionCreator, GenericStoreApi } from '~/types';

export const $STOREDEF = Symbol('store-definition-api');
export const $NAME = Symbol('store-state-name');
export const $EXTENSION = Symbol('store-state-extension');

export function create<P extends any[], T extends GenericStoreApi>(
  name: string,
  creator: (...args: P) => T,
): (...args: P) => ApiDefinitionCreator<T> {
  let id = 0;
  return (...args) => {
    const resolvedName = `${name}-${++id}`;
    const extensions: Array<(ctx: T) => {}> = [];

    const apiDefinition: ApiDefinitionCreator<T> = {
      [$NAME]: resolvedName,
      [$EXTENSION]: extensions,
      [$STOREDEF]: () => creator(...args),
      extend(createPlugin) {
        extensions.push((context) => {
          return Object.assign(context, createPlugin(context));
        });
        return this as any;
      },
    };

    return apiDefinition;
  };
}
