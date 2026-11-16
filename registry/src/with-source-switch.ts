import { untrack } from 'solid-js';
import { reconcile, unwrap } from 'solid-js/store';
import { createPlugin, type GenericStoreApi } from 'statebuilder';

/** Where the state is loaded from and saved to. Sync or async. */
export interface Source<T> {
  load(): T | Promise<T>;
  save(value: T): void | Promise<void>;
}

export interface WithSourceSwitchOptions<T> {
  /** Read on every call, so it can be a signal such as `() => auth.loggedIn()`. */
  useRemote: () => boolean;
  local: Source<NoInfer<T>>;
  remote: Source<NoInfer<T>>;
}

export interface SourceSwitch {
  /** Loads from the current source and replaces the state with the result. */
  load(): Promise<void>;
  /** Saves a plain copy of the state to the current source. */
  save(): Promise<void>;
  current(): 'local' | 'remote';
}

function replaceState<T>(store: GenericStoreApi<T>, value: T) {
  // set on a defineStore store merges an object into the state, so reconcile
  // is needed to drop keys. A signal's set replaces the value.
  store.set('get' in store ? reconcile(value) : () => value);
}

export function withSourceSwitch<T>(options: WithSourceSwitchOptions<T>) {
  const current = () => (options.useRemote() ? 'remote' : 'local');

  return createPlugin(
    (store: GenericStoreApi<T>) => {
      const source: SourceSwitch = {
        current,
        async load() {
          replaceState(store, await options[current()].load());
        },
        async save() {
          const value = structuredClone(unwrap(untrack(store)));
          await options[current()].save(value);
        },
      };
      return { source };
    },
    { name: 'withSourceSwitch' },
  );
}
