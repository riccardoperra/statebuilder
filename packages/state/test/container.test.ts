import { describe, expect, it } from 'vitest';
import { Container, defineStore } from '../src';
import { createRoot, getOwner } from 'solid-js';

function chain(provide: readonly any[] = []) {
  return createRoot(() => {
    const root = Container.create({ owner: getOwner()! });
    const child = Container.create({
      owner: getOwner()!,
      parent: root,
      provide,
    });
    return { root, child };
  });
}

describe('Container', () => {
  it('should create container', () =>
    createRoot(() => {
      const container = Container.create({ owner: getOwner()! });
      expect(container).toBeInstanceOf(Container);
    }));

  it('returns the same store on every get', () =>
    createRoot(() => {
      const container = Container.create({ owner: getOwner()! });
      const def = defineStore(() => ({}));

      expect(container.get(def)).toBe(container.get(def));
    }));

  it('resolves an unprovided definition in the root whoever asks first', () => {
    const def = defineStore(() => ({}));
    const { root, child } = chain();

    const fromChild = child.get(def);

    expect(root.get(def)).toBe(fromChild);
  });

  it('resolves a provided definition in the providing container', () => {
    const def = defineStore(() => ({ value: 'root' }));
    const { root, child } = chain([def]);

    child.get(def).set('value', 'child');

    expect(child.get(def)().value).toBe('child');
    expect(root.get(def)().value).toBe('root');
  });
});
