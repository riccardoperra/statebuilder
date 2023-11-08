import {
  createResource,
  NoInfer,
  Resource as InternalResource,
  ResourceActions as InternalResourceActions,
  ResourceFetcher,
  ResourceOptions,
  Setter,
  Signal,
} from 'solid-js';
import { GenericStoreApi } from '~/types';
import { create } from '~/api';

export interface ResourceActions<T> {
  set: InternalResourceActions<T>['mutate'];
  refetch: InternalResourceActions<T>['refetch'];
}

export type Resource<T> = GenericStoreApi<T, Setter<T>> &
  InternalResource<T> &
  ResourceActions<T>;

function makeResource<T>(
  resourceFetcher: ResourceFetcher<true, T, true>,
  options?: ResourceOptions<NoInfer<T>, true>,
): Resource<T> {
  const [state, { mutate, refetch }] = createResource(
    resourceFetcher.bind(resourceFetcher),
    options ?? {},
  );

  Reflect.set(state, 'set', mutate);
  Reflect.set(state, 'refetch', refetch);

  return state as unknown as Resource<T>;
}

export const ɵdefineResource = create('resource', makeResource);

export function ɵWithResourceStorage<T>(store: GenericStoreApi<T>) {
  return function (_: T | undefined): Signal<T | undefined> {
    return [
      () => store(),
      (v: T) => {
        const value = typeof v === 'function' ? v(store()) : v;
        store.set(value);
        return store;
      },
    ] as Signal<T | undefined>;
  };
}
