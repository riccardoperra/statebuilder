/*
 * Copyright 2025 Riccardo Perra
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { createSignal, Setter } from 'solid-js';
import type { ApiDefinitionCreator, GenericStoreApi } from '../../src';
import { create as fns } from '../../src';
import type { Lazy } from '../../src/types';

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

export const defineSignal = fns('signal', makeSignal);
