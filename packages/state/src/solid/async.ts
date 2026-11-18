import { createSignal, refresh, type Setter } from 'solid-js';
import type { GenericStoreApi } from '@statebuilder/container';
import { create } from '@statebuilder/container';

export type AsyncSource<T> = () => PromiseLike<T> | AsyncIterable<T> | T;

export type AsyncStore<T> = GenericStoreApi<T, Setter<T>> & {
  /** Runs the source again. The current value stays readable meanwhile. */
  refetch: () => void;
};

/**
 * A store whose value comes from an async source. Reading it before the first
 * value arrives suspends the nearest `<Loading>`. `isPending(() => store())`
 * tells when a new value is in flight.
 */
function makeAsync<T>(source: AsyncSource<T>): AsyncStore<T> {
  const [state, setState] = createSignal<T>(source);
  let written: { value: T } | undefined;

  const set = ((...args: [never]) => {
    const value = setState(...args) as T;
    written = { value };
    // The write is readable from the store after the flush that follows.
    queueMicrotask(() => (written = undefined));
    return value;
  }) as Setter<T>;

  return Object.assign(state, {
    set,
    refetch: () => refresh(state),
    peek: () => (written ? written.value : state()),
  });
}

export const defineAsync = create('async', makeAsync);
