import { $EXTENSION, $NAME, $STOREDEF } from '~/api';

export type Wrap<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;

export type GenericStoreApi<
  T = unknown,
  Setter extends (...args: any) => unknown = (...args: any) => unknown,
> = {
  (): T;
  set: Setter;
};

export type ApiDefinitionCreator<
  TStoreApi extends GenericStoreApi<any, any>,
  TSignalExtension extends {} = {},
> = StoreApiDefinition<TStoreApi, TSignalExtension> & {
  extend<TExtendedSignal>(
    createPlugin: (ctx: TStoreApi & TSignalExtension) => TExtendedSignal,
  ): ApiDefinitionCreator<
    TStoreApi,
    Wrap<
      unknown extends TSignalExtension
        ? TExtendedSignal
        : TExtendedSignal & TSignalExtension
    >
  >;
};

export type StoreApiDefinition<
  TStoreApi extends GenericStoreApi<any, (...args: any) => any>,
  TStoreExtension = unknown,
> = {
  [$NAME]: string;
  [$STOREDEF]: () => TStoreApi;
  [$EXTENSION]: Array<(ctx: TStoreApi) => TStoreExtension>;
};

export type GetStoreDefinitionValue<T extends GenericStoreApi<any, any>> =
  T extends GenericStoreApi<infer TValue, any> ? TValue : never;

export type UnwrapStoreDefinition<T extends StoreApiDefinition<any, any>> =
  T extends StoreApiDefinition<infer TStoreApi, infer TExtensions>
    ? TStoreApi & TExtensions
    : never;
