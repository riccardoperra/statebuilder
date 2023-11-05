import { assert, describe, it } from 'vitest';
import { Container, defineStore } from '../src';
import { createRoot, getOwner } from 'solid-js';

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
