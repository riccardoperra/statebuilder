import { Store, StoreValue } from '../types';
import { createSignal } from 'solid-js';

export function withAsyncAction() {
  return <T extends StoreValue>(ctx: Store<T>) => {
    return {
      asyncAction<P, R>(doSomething: (payload: P) => Promise<R>) {
        return makeAsyncAction(doSomething);
      },
    };
  };
}

export interface AsyncAction<T, R> {
  (payload: T): void;

  (payload?: void): void;

  loading: boolean;

  latestValue(): R | undefined;
}

export function makeAsyncAction<T, R = void>(
  effectGeneratorCallback: (data: T) => Promise<R>,
): AsyncAction<T, R> {
  const [loading, setLoading] = createSignal<boolean>(false);
  const [latestValue, setLatestValue] = createSignal<R>();

  function notify(state?: T | void) {
    setLoading(true);
    effectGeneratorCallback(state as T)
      .then((result) => {
        setLatestValue(() => result);
      })
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
  });

  return notify as AsyncAction<T, R>;
}
