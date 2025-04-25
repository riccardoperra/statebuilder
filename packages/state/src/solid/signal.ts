import { createSignal, Setter } from 'solid-js';
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
  const [signal, setSignal] = createSignal(initialValue());

  Object.defineProperty(signal, 'set', {
    value: setSignal,
    writable: true,
    configurable: true,
  });

  return signal as Signal<TState>;
}

export const defineSignal = create('signal', makeSignal);
