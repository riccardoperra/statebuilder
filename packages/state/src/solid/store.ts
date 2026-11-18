import {
  type Accessor,
  createSignal,
  createStore,
  snapshot,
  type StoreSetter,
} from 'solid-js';
import { ApiDefinitionCreator, GenericStoreApi } from '@statebuilder/container';
import { create } from '@statebuilder/container';
import { replaceState } from './replace';

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
  // Lets `store()` track every write, whatever property it changes.
  const [track, notify] = createSignal(undefined, { equals: false });

  const set: StoreSetter<TState> = (fn) => {
    setStore((draft) => {
      const next = fn(draft);
      // Solid skips a key whose new value is the object the store already
      // holds, so returning an earlier `peek()` would keep the nested writes
      // made since. Writing the differences restores it.
      if (next !== undefined && next !== draft) replaceState(draft, next);
    });
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
