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

import { getOwner, type Owner } from './reactivity';
import { StateBuilderError } from './error';
import { runInSubRoot } from './root';
import { resolve } from './api';
import { $CREATOR } from './symbols';
import { $SB_DEV, __devDestroyContainer, __devRegisterContainer } from './dev';
import type {
  ExtractStore,
  GenericStoreApi,
  StoreApiDefinition,
} from './types';

export interface ContainerOptions {
  owner?: Owner;
  parent?: Container;
  provide?: readonly StoreApiDefinition<any, any>[];
}

export class Container {
  readonly #stores = new Map<StoreApiDefinition<any, any>, GenericStoreApi>();
  // An inject only resolves in the same container or above it, so a cycle always closes inside one container.
  readonly #resolving: StoreApiDefinition<any, any>[] = [];
  readonly #owner: Owner;
  readonly #parent: Container | undefined;
  readonly #provided: ReadonlySet<StoreApiDefinition<any, any>>;

  protected constructor(options: ContainerOptions, owner: Owner) {
    this.#owner = owner;
    this.#parent = options.parent;
    this.#provided = new Set(options.provide);
    $SB_DEV && __devRegisterContainer(this);
  }

  static create(options: ContainerOptions = {}) {
    const resolvedOwner = options.owner ?? getOwner()!;
    if (!resolvedOwner) {
      console.warn(
        '[statebuilder] Using StateContainer without <StoreProvider/> or `createRoot()` context is discouraged',
      );
    }
    return new Container(options, resolvedOwner);
  }

  destroy(): void {
    this.#stores.clear();
    $SB_DEV && __devDestroyContainer(this);
  }

  remove<TStoreDefinition extends StoreApiDefinition<any, any>>(
    state: TStoreDefinition,
  ): void {
    this.#stores.delete(state);
  }

  get<TStoreDefinition extends StoreApiDefinition<any, any>>(
    state: TStoreDefinition,
  ): ExtractStore<TStoreDefinition> {
    if (!state[$CREATOR]) {
      throw new StateBuilderError('No state $CREATOR found.', {
        cause: { state: state },
      });
    }
    try {
      return this.#home(state).#getOrCreate(
        state,
      ) as ExtractStore<TStoreDefinition>;
    } catch (exception) {
      if (exception instanceof Error) throw exception;
      throw new StateBuilderError(
        'An error occurred during store initialization',
        { cause: exception },
      );
    }
  }

  #home(definition: StoreApiDefinition<any, any>): Container {
    let container: Container = this;
    while (!container.#provided.has(definition) && container.#parent) {
      container = container.#parent;
    }
    return container;
  }

  #getOrCreate(definition: StoreApiDefinition<any, any>): GenericStoreApi {
    const instance = this.#stores.get(definition);
    if (instance) {
      return instance;
    }
    const cycleStart = this.#resolving.indexOf(definition);
    if (cycleStart !== -1) {
      const cycle = [...this.#resolving.slice(cycleStart), definition]
        .map((entry) => entry[$CREATOR].name)
        .join(' -> ');
      throw new StateBuilderError(
        `Circular dependency between stores: ${cycle}`,
      );
    }
    this.#resolving.push(definition);
    try {
      const store = runInSubRoot(() => resolve(definition, this), this.#owner);
      this.#stores.set(definition, store);
      return store;
    } finally {
      this.#resolving.pop();
    }
  }
}
