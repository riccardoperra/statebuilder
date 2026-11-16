import { createSignal, untrack } from 'solid-js';
import { reconcile, unwrap } from 'solid-js/store';
import { createPlugin, type GenericStoreApi } from 'statebuilder';

export interface OptimisticAction<P> {
  /** Resolves when the call settles. Never rejects: a failure goes to `error`. */
  (payload: P): Promise<void>;
  (payload?: void): Promise<void>;
  readonly loading: boolean;
  readonly error: unknown;
}

/** A plain copy, never the store proxy, so later writes cannot change it. */
const snapshot = <T>(value: T): T => structuredClone(unwrap(value));

function replaceState<T>(store: GenericStoreApi<T>, value: T) {
  // set on a defineStore store merges an object into the state, so reconcile
  // is needed to drop keys. A signal's set replaces the value.
  store.set('get' in store ? reconcile(value) : () => value);
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
          const before = snapshot(untrack(store));
          return new Promise((resolve) => resolve(fn(payload))).then(
            () => {},
            (reason: unknown) => {
              replaceState(store, before);
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
