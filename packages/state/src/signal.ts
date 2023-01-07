import { createSignal, Setter } from 'solid-js';
import type { GenericStoreApi } from './types';
import { ApiDefinitionCreator } from './types';
import { create } from './api';

export type Signal<TState> = GenericStoreApi<TState, Setter<TState>>;

export type SignalDefinitionCreator<
  T,
  TStoreApi extends GenericStoreApi<T, any>,
  TSignalExtension extends {},
> = ApiDefinitionCreator<TStoreApi, TSignalExtension>;

type MakeSignalConfiguration<TState> = {
  initialValue: () => TState;
};

function makeSignal<TState, TSignalExtension>(
  options: MakeSignalConfiguration<TState>,
): Signal<TState> {
  const [signal, setSignal] = createSignal(options.initialValue());

  Object.defineProperties(signal, {
    set: {
      value: setSignal,
    },
  });

  return signal as Signal<TState>;
}

export const defineSignal = create('signal', <T>(initialValue: () => T) => {
  return makeSignal({ initialValue: initialValue });
});
