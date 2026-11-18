import { createSignal, type Setter } from 'solid-js';
import type {
  ApiDefinitionCreator,
  GenericStoreApi,
} from '@statebuilder/container';
import { create } from '@statebuilder/container';

export type Signal<TState> = GenericStoreApi<TState, Setter<TState>>;

export type SignalDefinitionCreator<
  T,
  TStoreApi extends GenericStoreApi<T, any>,
  TSignalExtension extends {},
> = ApiDefinitionCreator<TStoreApi, TSignalExtension>;

function makeSignal<TState>(initialValue: () => TState): Signal<TState> {
  let latest = initialValue();
  const [signal, setSignal] = createSignal<TState>(
    latest as Exclude<TState, Function>,
  );

  const set = ((...args: [never]) => {
    latest = setSignal(...args) as TState;
    return latest;
  }) as Setter<TState>;

  return Object.assign(signal, { set, peek: () => latest });
}

export const defineSignal = create('signal', makeSignal);
