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

import { assert, describe, it } from 'vitest';
import { Container } from '../src';
import { createRoot, getOwner } from 'solid-js';
import { defineStore } from './utils/store';

describe('Container', () => {
  it('should create container', () =>
    createRoot(() => {
      const owner = getOwner()!;
      const container = Container.create(owner);
      assert.instanceOf(container, Container);
    }));

  it('should create state', () =>
    createRoot(() => {
      const owner = getOwner()!;
      const container = Container.create(owner);
      const stateDef = defineStore(() => ({}));

      const state = container.get(stateDef);

      assert.instanceOf(state, Function);
      assert.ok(container['states'].size === 1);
    }));

  it('should inject state from parent container', () => {
    createRoot(() => {
      const owner = getOwner()!;
      const parentContainer = Container.create(owner);
      const container = Container.create(owner, parentContainer);
      const def = defineStore(() => ({}));
      const stateFromParentContainer = parentContainer.get(def);
      const stateFromContainer = container.get(def);
      assert.strictEqual(stateFromContainer, stateFromParentContainer);
      assert.isTrue(container['states'].size === 0);
      assert.isTrue(parentContainer['states'].size === 1);
    });
  });
});
