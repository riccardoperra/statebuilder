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

import { Accessor, createSignal } from 'solid-js';
import { createStore, SetStoreFunction } from 'solid-js/store';
import { ApiDefinitionCreator, create, GenericStoreApi } from '../../src/index';
import type { Lazy } from '../../src/types';

export type StoreValue = {};

export type Store<TState extends StoreValue> = GenericStoreApi<
  TState,
  SetStoreFunction<TState>
> & {
  get: TState;
};

export type StoreDefinitionCreator<
  T extends StoreValue,
  TStoreApi extends GenericStoreApi<T, any>,
  TStoreExtension extends {},
> = ApiDefinitionCreator<TStoreApi, TStoreExtension>;

function makeStore<TState extends StoreValue>(
  initialValue: Lazy<TState>,
): Store<TState> {
  const [store, internalSetStore] = createStore(initialValue());
  const [track, notify] = createSignal([], { equals: false });

  const set: SetStoreFunction<TState> = (...args: unknown[]) => {
    (internalSetStore as any)(...args);
    notify([]);
  };

  const accessor: Accessor<TState> = () => {
    track();
    return store;
  };

  return Object.assign(accessor, {
    set,
    get: store,
  });
}

export const defineStore = create('store', makeStore);
