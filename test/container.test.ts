import { afterEach, describe, expect, it, vi } from 'vitest';
import { Container, defineStore } from '../src';
import { createRoot, getOwner } from 'solid-js';

describe('Container', () => {
  const owner = getOwner()!;

  it('should create container', function() {
    const container = new Container(owner);
    expect(container).toBeInstanceOf(Container);
  });

  it('should create state', function() {
    const container = new Container(owner);
    const stateDef = defineStore({});

    const state = container.get(stateDef);

    expect(state).toBeInstanceOf(Function);
    expect(container['states'].size).toEqual(1);
  });
});
