import { batch, createSignal, untrack } from 'solid-js';
import { reconcile, unwrap } from 'solid-js/store';
import {
  createPlugin,
  type ContainerPluginContext,
  type GenericStoreApi,
} from 'statebuilder';

export interface WithHistoryOptions {
  /** How many undo steps to keep. Defaults to 100. */
  limit?: number;
}

export interface History {
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;
  clear(): void;
}

/** A plain copy, never the store proxy, so later writes cannot change it. */
const snapshot = <T>(value: T): T => structuredClone(unwrap(value));

function replaceState<T>(store: GenericStoreApi<T>, value: T) {
  const copy = snapshot(value);
  // set on a defineStore store merges an object into the state, so reconcile
  // is needed to drop keys. A signal's set replaces the value.
  store.set('get' in store ? reconcile(copy) : () => copy);
}

export function withHistory(options: WithHistoryOptions = {}) {
  const limit = options.limit ?? 100;

  return createPlugin(
    <T>(
      store: GenericStoreApi<T>,
      context: ContainerPluginContext<GenericStoreApi<T>>,
    ) => {
      const [past, setPast] = createSignal<T[]>([]);
      const [future, setFuture] = createSignal<T[]>([]);
      let present = snapshot(untrack(store));
      let restoring = false;

      context.onSet((value) => {
        if (restoring) return;
        setPast((entries) => [...entries, present].slice(-limit));
        setFuture([]);
        present = snapshot(value);
      });

      function restore(next: T) {
        present = next;
        restoring = true;
        try {
          replaceState(store, next);
        } finally {
          restoring = false;
        }
      }

      const history: History = {
        undo() {
          const entries = untrack(past);
          if (entries.length === 0) return;
          const previous = entries[entries.length - 1];
          batch(() => {
            setPast(entries.slice(0, -1));
            setFuture((next) => [present, ...next]);
          });
          restore(previous);
        },
        redo() {
          const entries = untrack(future);
          if (entries.length === 0) return;
          const [next, ...rest] = entries;
          batch(() => {
            setFuture(rest);
            setPast((entries) => [...entries, present]);
          });
          restore(next);
        },
        canUndo: () => past().length > 0,
        canRedo: () => future().length > 0,
        clear() {
          batch(() => {
            setPast([]);
            setFuture([]);
          });
        },
      };

      return { history };
    },
    { name: 'withHistory' },
  );
}
