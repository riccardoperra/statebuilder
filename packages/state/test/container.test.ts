import { describe, expect, it } from 'vitest';
import { Container, defineStore } from '../src';
import { getOwner } from 'solid-js';

describe('Container', () => {
  const owner = getOwner()!;

  it('should create container', function() {
    const container = Container.create(owner);
    expect(container).toBeInstanceOf(Container);
  });

  it('should create state', function() {
    const container = Container.create(owner);
    const stateDef = defineStore(() => ({}));

    const state = container.get(stateDef);

    expect(state).toBeInstanceOf(Function);
    expect(container['states'].size).toEqual(1);
  });
});
