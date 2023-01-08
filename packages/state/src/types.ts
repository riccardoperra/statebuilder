import { $CREATOR, $EXTENSION, $NAME, $PLUGIN } from '~/api';

export type Wrap<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;

export type GenericStoreApi<
  T = any,
  Setter extends (...args: any) => any = (...args: any) => any,
> = {
  (): T;
  set: Setter;
};

export type ApiDefinitionCreator<
  TStoreApi extends GenericStoreApi<any, any>,
  TSignalExtension extends {} = {},
> = StoreApiDefinition<TStoreApi, TSignalExtension> & {
  extend<
    TPlugin extends Plugin<any, any>,
    TPluginStoreApi extends GenericStoreApi<any, any> = TPlugin extends Plugin<
      infer StorePlugin,
      any
    >
      ? StorePlugin
      : never,
  >(
    // We need to unwrap the type again the store api in order to
    // avoid passing plugins that have some type store constraints :)
    plugin: TPluginStoreApi extends any
      ? TStoreApi extends TPluginStoreApi
        ? TPlugin
        : never
      : never,
  ): ApiDefinitionCreator<
    TStoreApi,
    TPlugin extends Plugin<any, infer R> ? R : never
  >;

  extend<TExtendedSignal extends {} | void>(
    createPlugin: (ctx: TStoreApi & TSignalExtension) => TExtendedSignal,
  ): ApiDefinitionCreator<
    TStoreApi,
    Wrap<TExtendedSignal & Omit<TSignalExtension, keyof TExtendedSignal>>
  >;
};

export type StoreApiDefinition<
  TStoreApi extends GenericStoreApi<any, (...args: any) => any>,
  TStoreExtension = unknown,
> = {
  [$NAME]: string;
  [$CREATOR]: () => TStoreApi;
  [$EXTENSION]: Array<Plugin<TStoreApi, TStoreExtension>>;
};

type MergeStoreProps<
  TStoreApi extends GenericStoreApi,
  TExtensions,
> = TExtensions extends {
  set: infer TSetterOverride & ((...args: any[]) => unknown);
}
  ? Omit<TStoreApi, 'set'> & { set: TSetterOverride }
  : TStoreApi & TExtensions;

export type ExtractStore<T extends StoreApiDefinition<any, any>> =
  T extends StoreApiDefinition<infer TStoreApi, infer TExtensions>
    ? MergeStoreProps<TStoreApi, TExtensions>
    : never;

export type Lazy<T> = () => T;

export type Plugin<TStoreApi extends GenericStoreApi<any, any>, R> = {
  [$PLUGIN]?: boolean;
  name: string;
  apply(storeApi: TStoreApi, options: PluginContext): R;
};

export type PluginContext = {
  plugins: readonly Plugin<any, any>[];
  metadata: Map<string, unknown>;
};
