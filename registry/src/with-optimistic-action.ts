import { createSignal } from 'solid-js';
import { createPlugin, type GenericStoreApi } from 'statebuilder';

export interface OptimisticAction<P> {
  /** Resolves when the call settles. Never rejects: a failure goes to `error`. */
  (payload: P): Promise<void>;
  (payload?: void): Promise<void>;
  readonly loading: boolean;
  readonly error: unknown;
}

/**
 * `store.optimistic(fn)` makes an action that copies the state, runs `fn`
 * (which writes at once and returns the request), and restores the copy when
 * the request rejects. Calls on one store run one at a time: a call made while
 * another is pending starts when it settles, so a rollback only undoes the
 * writes of its own call.
 */
export function withOptimisticAction() {
  return createPlugin(
    <T>(store: GenericStoreApi<T>) => {
      let queue: Promise<void> | undefined;

      function optimistic<P>(
        fn: (payload: P) => Promise<unknown>,
      ): OptimisticAction<P> {
        const [loading, setLoading] = createSignal(false);
        const [error, setError] = createSignal<unknown>();
        let pending = 0;

        const run = (payload: P) => {
          setError(undefined);
          // peek(), not store(): the rollback of the previous call may not be
          // flushed yet. For a store it is a snapshot later writes leave alone.
          const before = store.peek();
          return new Promise((resolve) => resolve(fn(payload))).then(
            () => {},
            (reason: unknown) => {
              // Replaces the whole state: a store drops the keys `fn` added and
              // keeps the identity of the objects that exist on both sides.
              store.set(() => before);
              setError(() => reason);
            },
          );
        };

        const action = (payload: P) => {
          pending++;
          setLoading(true);
          const call = queue ? queue.then(() => run(payload)) : run(payload);
          queue = call;
          return call.then(() => {
            if (queue === call) queue = undefined;
            if (--pending === 0) setLoading(false);
          });
        };

        return Object.defineProperties(action, {
          loading: { get: loading },
          error: { get: error },
        }) as OptimisticAction<P>;
      }

      return { optimistic };
    },
    { name: 'withOptimisticAction' },
  );
}
