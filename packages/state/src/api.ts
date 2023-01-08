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
    const extensions: Array<(ctx: T) => {}> = [];

    const apiDefinition: ApiDefinitionCreator<T> = {
      [$NAME]: resolvedName,
      [$EXTENSION]: extensions,
      [$CREATOR]: () => creator(...args),

      extend(createPlugin) {
        extensions.push((context) =>
          Object.assign(context, createPlugin(context)),
        );
        return this as any;
      },
    };

    return apiDefinition;
  };
}

export function resolve<TDefinition extends StoreApiDefinition<any, any>>(
  definition: TDefinition,
) {
  const creatorFn = definition[$CREATOR],
    extensions = definition[$EXTENSION];

  return extensions.reduce(
    (acc, extension) => Object.assign(acc, extension(acc)),
    creatorFn(),
  );
}
