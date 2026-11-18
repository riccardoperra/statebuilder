import { createSignal } from 'solid-js';
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

export function withHistory(options: WithHistoryOptions = {}) {
  const limit = options.limit ?? 100;

  return createPlugin(
    <T>(
      store: GenericStoreApi<T>,
      context: ContainerPluginContext<GenericStoreApi<T>>,
    ) => {
      // The arrays are the source of truth: a signal read right after its
      // write is stale until the flush. The signal only makes canUndo and
      // canRedo reactive. Entries are peek() and onSet values, which for a
      // store are snapshots that later writes do not change.
      let past: T[] = [];
      let future: T[] = [];
      let present = store.peek();
      let restoring = false;
      const [sizes, setSizes] = createSignal({ past: 0, future: 0 });

      function commit(nextPast: T[], nextFuture: T[]) {
        past = nextPast;
        future = nextFuture;
        setSizes({ past: past.length, future: future.length });
      }

      context.onSet((value) => {
        if (restoring) return;
        commit([...past, present].slice(-limit), []);
        present = value;
      });

      function restore(next: T) {
        present = next;
        restoring = true;
        try {
          // Replaces the whole state: a store drops the keys `next` lacks and
          // keeps the identity of the objects that exist on both sides.
          store.set(() => next);
        } finally {
          restoring = false;
        }
      }

      const history: History = {
        undo() {
          if (past.length === 0) return;
          const previous = past[past.length - 1];
          commit(past.slice(0, -1), [present, ...future]);
          restore(previous);
        },
        redo() {
          if (future.length === 0) return;
          const [next, ...rest] = future;
          commit([...past, present], rest);
          restore(next);
        },
        canUndo: () => sizes().past > 0,
        canRedo: () => sizes().future > 0,
        clear: () => commit([], []),
      };

      return { history };
    },
    { name: 'withHistory' },
  );
}
