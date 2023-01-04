import { createMemo, createSignal } from 'solid-js';
import { createStore, SetStoreFunction } from 'solid-js/store';
import type { Store, StoreDefinition, StoreValue, Wrap } from './types';

let id = 0;
export const $NAME = Symbol('store-state-name');
export const $EXTENSION = Symbol('store-state-extension');

export type StoreDefinitionCreator<
  T extends StoreValue,
  TStoreExtension extends {}
> = StoreDefinition<T, TStoreExtension> & {
  extend<TExtendedStore>(
    createPlugin: (ctx: Store<T> & TStoreExtension) => TExtendedStore,
  ): StoreDefinitionCreator<T, Wrap<unknown extends TStoreExtension ? TExtendedStore : TExtendedStore & TStoreExtension>>;
}

type MakeStoreConfiguration<TState extends StoreValue> = {
  initialValue: TState
}

export function makeStore<
  TState extends StoreValue,
  TStoreExtension
>(
  options: MakeStoreConfiguration<TState>,
): Store<TState> {
  const [store, internalSetStore] = createStore(options.initialValue);
  const [track, notify] = createSignal(undefined, { equals: false });

  const set: SetStoreFunction<TState> = (...args: unknown[]) => {
    (internalSetStore as any)(...args);
    notify();
  };

  const accessor = createMemo(() => {
    track();
    return store;
  });

  return new Proxy(Object.assign(accessor, {
    set,
    get: store,
  }), {});
}

export function defineStore<
  TState extends StoreValue,
>(
  initialValue: TState,
): StoreDefinitionCreator<TState, {}> {
  const name = `state-${++id}`;
  const extensions: Array<(ctx: Store<TState>) => {}> = [];

  return {
    [$NAME]: name,
    [$EXTENSION]: extensions,
    initialValue,
    extend(createPlugin) {
      extensions.push((context) => {
        return Object.assign(context, createPlugin(context));
      });
      return this as any;
    },
  };
}
