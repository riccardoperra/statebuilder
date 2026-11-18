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
  /** Saves the state to the current source, as a snapshot for a store. */
  save(): Promise<void>;
  current(): 'local' | 'remote';
}

export function withSourceSwitch<T>(options: WithSourceSwitchOptions<T>) {
  const current = () => (options.useRemote() ? 'remote' : 'local');

  return createPlugin(
    (store: GenericStoreApi<T>) => {
      const source: SourceSwitch = {
        current,
        async load() {
          const value = await options[current()].load();
          // Replaces the whole state: a store drops the keys `value` lacks.
          store.set(() => value);
        },
        async save() {
          // peek() includes writes not flushed yet. A store's is a snapshot
          // that later writes do not change.
          await options[current()].save(store.peek());
        },
      };
      return { source };
    },
    { name: 'withSourceSwitch' },
  );
}
