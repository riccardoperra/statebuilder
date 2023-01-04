import { SetStoreFunction } from 'solid-js/store';
import { $EXTENSION, $NAME } from './store';

export type Wrap<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;

export type Store<TState extends StoreValue> = {
  (): TState;

  get: TState;
  set: SetStoreFunction<TState>;
}

export type StoreDefinition<
  T extends StoreValue,
  TStoreExtension = unknown
> = {
  [$NAME]: string;
  [$EXTENSION]: Array<(ctx: Store<T>) => TStoreExtension>;
  initialValue: T;
}

export type StoreValue = {};
