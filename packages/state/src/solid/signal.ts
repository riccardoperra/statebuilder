import { createSignal, Setter } from 'solid-js';
import type { ApiDefinitionCreator, GenericStoreApi, Lazy } from '../types';
import { create } from '../api';

export type Signal<TState> = GenericStoreApi<TState, Setter<TState>>;

export type SignalDefinitionCreator<
  T,
  TStoreApi extends GenericStoreApi<T, any>,
  TSignalExtension extends {},
> = ApiDefinitionCreator<TStoreApi, TSignalExtension>;

function makeSignal<TState>(initialValue: Lazy<TState>): Signal<TState> {
  const [signal, setSignal] = createSignal(initialValue());

  Object.defineProperty(signal, 'set', {
    value: setSignal,
    writable: true,
    configurable: true,
  });

  return signal as Signal<TState>;
}

export const defineSignal = create('signal', makeSignal);
