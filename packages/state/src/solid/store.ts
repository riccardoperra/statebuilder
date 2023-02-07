import { Accessor, createSignal } from 'solid-js';
import { createStore, SetStoreFunction } from 'solid-js/store';
import { ApiDefinitionCreator, GenericStoreApi, Lazy } from '../types';
import { create } from '../api';

export type StoreValue = {};

export type Store<TState extends StoreValue> = GenericStoreApi<
  TState,
  SetStoreFunction<TState>
> & {
  get: TState;
};

export type StoreDefinitionCreator<
  T extends StoreValue,
  TStoreApi extends GenericStoreApi<T, any>,
  TStoreExtension extends {},
> = ApiDefinitionCreator<TStoreApi, TStoreExtension>;

function makeStore<TState extends StoreValue>(
  initialValue: Lazy<TState>,
): Store<TState> {
  const [store, internalSetStore] = createStore(initialValue());
  const [track, notify] = createSignal([], { equals: false });

  const set: SetStoreFunction<TState> = (...args: unknown[]) => {
    (internalSetStore as any)(...args);
    notify([]);
  };

  const accessor: Accessor<TState> = () => {
    track();
    return store;
  };

  return Object.assign(accessor, {
    set,
    get: store,
  });
}

export const defineStore = create('store', makeStore);
