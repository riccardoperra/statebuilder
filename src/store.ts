import { Accessor, createMemo, createSignal } from 'solid-js';
import { createStore, SetStoreFunction, unwrap } from 'solid-js/store';

export interface Store<T> {
  get: Accessor<T>;
  set: SetStoreFunction<T>;
  state: T;

  extend<Data>(mergeCb: (ctx: Store<T>) => Data): Store<T> & Data;
}

export function defineStore<TState extends object>(
  initialState: TState,
): Store<TState> {
  const [notification, notify] = createSignal(undefined, { equals: false });
  const [store, internalSetStore] = createStore(initialState);

  const setStore: SetStoreFunction<TState> = (...args: unknown[]) => {
    (internalSetStore as any)(...args);
    notify();
  };

  const get = createMemo(() => {
    notification();
    return unwrap(store);
  });

  return {
    get,
    set: setStore,
    state: store,
    extend(ctx) {
      return Object.assign(this, ctx(this));
    },
  };
}
