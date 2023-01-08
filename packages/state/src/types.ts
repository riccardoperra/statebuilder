import { $EXTENSION, $NAME, $CREATOR } from '~/api';

export type Wrap<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;

export type GenericStoreApi<
  T = unknown,
  Setter extends (...args: any) => unknown = (...args: any) => unknown,
> = {
  (): T;
  set: Setter;
  [key: string]: unknown;
};

export type ApiDefinitionCreator<
  TStoreApi extends GenericStoreApi<any, any>,
  TSignalExtension extends {} = {},
> = StoreApiDefinition<TStoreApi, TSignalExtension> & {
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
  [$EXTENSION]: Array<(ctx: TStoreApi) => TStoreExtension>;
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
