import { $CREATOR, $PLUGIN } from '~/api';

export type Wrap<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;

export type GenericStoreApi<
  T = any,
  Setter extends (...args: any) => any = (...args: any) => any,
> = {
  (): T;
  set: Setter;
};

export interface ApiDefinitionCreator<
  TStoreApi extends GenericStoreApi,
  TSignalExtension extends {} = {},
> extends StoreApiDefinition<TStoreApi, TSignalExtension> {
  extend<TExtendedSignal extends {} | void>(
    createPlugin: (ctx: TStoreApi & TSignalExtension) => TExtendedSignal,
  ): ApiDefinitionCreator<
    TStoreApi,
    TExtendedSignal & Omit<TSignalExtension, keyof TExtendedSignal>
  >;
}

export interface StoreApiDefinition<
  TStoreApi extends GenericStoreApi,
  TStoreExtension = unknown,
> {
  [$CREATOR]: {
    name: string;
    plugins: Array<
      | PluginCreatorFunction<TStoreApi, TStoreExtension>
      | Plugin<TStoreApi, TStoreExtension>
    >;
    factory: () => TStoreApi;
  };
}

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

export type PluginMetadata = {
  name: string;
  dependencies: string[];
};

export type Plugin<TStoreApi extends GenericStoreApi<any, any>, R> = {
  [$PLUGIN]?: PluginMetadata;
  name: string;
  apply(storeApi: TStoreApi, options: PluginContext): R;
};

export type PluginOf<Callback> = Callback;

export type GetStoreApiSetter<T extends GenericStoreApi> =
  T extends GenericStoreApi<any, infer R> ? R : never;

export type GetStoreApiState<T extends GenericStoreApi> =
  T extends GenericStoreApi<infer S, any> ? S : never;

export type PluginContext = {
  plugins: readonly Plugin<any, any>[];
  metadata: Map<string, unknown>;
};

export type MarkPlugin<T> = T & { [$PLUGIN]: true };

export type PluginCreatorFunction<
  TStoreApi extends GenericStoreApi,
  TReturn,
> = (
  store: TStoreApi,
) => TReturn extends Plugin<any, any> ? TReturn : Plugin<TStoreApi, TReturn>;
