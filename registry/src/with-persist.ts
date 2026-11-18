import { createSignal, runWithOwner, type Accessor } from 'solid-js';
import {
  createPlugin,
  type ContainerPluginContext,
  type GenericStoreApi,
} from 'statebuilder';

/** localStorage fits as is. Wrap IndexedDB or a cookie store to match. */
export interface PersistStorage {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}

// NoInfer: T is the state of the store this plugin extends. Without it, the
// return type of deserialize or select would decide T instead.
export interface WithPersistOptions<T> {
  key: string;
  storage: PersistStorage;
  /** Defaults to `JSON.stringify`. */
  serialize?: (value: Partial<NoInfer<T>>) => string;
  /** Defaults to `JSON.parse`. */
  deserialize?: (raw: string) => Partial<NoInfer<T>>;
  /** Picks what to save. Defaults to the whole state. */
  select?: (state: T) => Partial<NoInfer<T>>;
}

export interface Persist {
  /** False until the saved value is read, true after, even when it was missing or invalid. */
  hydrated: Accessor<boolean>;
  /** Removes the saved value. The state is unchanged. */
  clear(): Promise<void>;
}

export function withPersist<T>(options: WithPersistOptions<T>) {
  const {
    key,
    storage,
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    select = (state: T): Partial<T> => state,
  } = options;

  return createPlugin(
    (
      store: GenericStoreApi<T>,
      context: ContainerPluginContext<GenericStoreApi<T>>,
    ) => {
      // `saving` gates the writes, not hydrated(): a signal read right after
      // its write is stale until the flush.
      let saving = false;
      const [hydrated, setHydrated] = createSignal(false);

      function hydrate(raw: string | null) {
        try {
          if (raw !== null) {
            const saved = deserialize(raw);
            // A defineStore store (it has `get`) merges the object into its
            // state, so keys added since the value was saved keep their
            // initial value. A signal takes it as its new value.
            store.set(() =>
              'get' in store ? { ...store.peek(), ...saved } : saved,
            );
          }
        } catch (error) {
          console.warn(
            `withPersist: ignored the value saved as "${key}"`,
            error,
          );
        }
        saving = true;
        setHydrated(true);
      }

      // Writes made before an async storage answers are not saved.
      context.onSet((value) => {
        if (saving) void storage.setItem(key, serialize(select(value)));
      });

      const raw = storage.getItem(key);
      if (raw instanceof Promise) raw.then(hydrate, () => hydrate(null));
      // Setup runs in an owned scope, where Solid throws on a write. The store
      // is not returned yet, so nothing has read the state it replaces.
      else runWithOwner(null, () => hydrate(raw));

      const persist: Persist = {
        hydrated,
        clear: async () => storage.removeItem(key),
      };
      return { persist };
    },
    { name: 'withPersist' },
  );
}
