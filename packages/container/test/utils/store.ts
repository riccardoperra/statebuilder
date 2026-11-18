import {
  type Accessor,
  createSignal,
  createStore,
  snapshot,
  type StoreSetter,
} from 'solid-js';
import {
  type ApiDefinitionCreator,
  create,
  type GenericStoreApi,
} from '../../src/index';

export type StoreValue = {};

export type Store<TState extends StoreValue> = GenericStoreApi<
  TState,
  StoreSetter<TState>
> & {
  get: TState;
};

export type StoreDefinitionCreator<
  T extends StoreValue,
  TStoreApi extends GenericStoreApi<T, any>,
  TStoreExtension extends {},
> = ApiDefinitionCreator<TStoreApi, TStoreExtension>;

function makeStore<TState extends StoreValue>(
  initialValue: () => TState,
): Store<TState> {
  const [store, setStore]: [TState, StoreSetter<TState>] = createStore(
    initialValue() as Record<PropertyKey, never>,
  );
  const [track, notify] = createSignal(undefined, { equals: false });

  const set: StoreSetter<TState> = (fn) => {
    setStore(fn);
    notify();
  };

  const accessor: Accessor<TState> = () => {
    track();
    return store;
  };

  return Object.assign(accessor, {
    set,
    get: store,
    peek: () => snapshot(store),
  });
}

export const defineStore = create('store', makeStore);
