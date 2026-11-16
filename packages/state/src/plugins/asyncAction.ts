import { createSignal } from 'solid-js';
import { createPlugin } from '@statebuilder/container';

export function withAsyncAction() {
  return createPlugin(
    () => {
      return {
        asyncAction<P, R>(doSomething: (payload: P) => Promise<R>) {
          return makeAsyncAction(doSomething);
        },
      };
    },
    { name: 'asyncAction' },
  );
}

export interface AsyncAction<T, R> {
  (payload: T): void;

  (payload?: void): void;

  readonly loading: boolean;

  readonly latestValue: R | undefined;

  readonly error: unknown;
}

export function makeAsyncAction<T, R = void>(
  effectGeneratorCallback: (data: T) => Promise<R>,
): AsyncAction<T, R> {
  const [loading, setLoading] = createSignal<boolean>(false);
  const [latestValue, setLatestValue] = createSignal<R>();
  const [error, setError] = createSignal<unknown>();

  function notify(state?: T | void) {
    setLoading(true);
    setError(undefined);
    effectGeneratorCallback(state as T)
      .then(
        (result) => setLatestValue(() => result),
        (reason) => setError(() => reason),
      )
      .finally(() => setLoading(false));
  }

  Object.defineProperties(notify, {
    loading: {
      get() {
        return loading();
      },
    },
    latestValue: {
      get() {
        return latestValue();
      },
    },
    error: {
      get() {
        return error();
      },
    },
  });

  return notify as AsyncAction<T, R>;
}
