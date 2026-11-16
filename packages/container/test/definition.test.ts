import { describe, expect, it } from 'vitest';
import { createRoot } from 'solid-js';
import { Container, StateBuilderError } from '../src';
import { defineSignal } from './utils/signal';

const defineKeyedSignal = defineSignal as unknown as <T>(
  initialValue: () => T,
  options: { key: string },
) => ReturnType<typeof defineSignal<T>>;

const inContainer = <T>(fn: (container: Container) => T) =>
  createRoot(() => fn(Container.create()));

describe('extend', () => {
  it('returns a new definition and leaves the original one unchanged', () => {
    const base = defineSignal(() => 1);
    const withA = base.extend(() => ({ a: 'a' }));
    const withB = base.extend(() => ({ b: 'b' }));

    inContainer((container) => {
      expect(Object.keys(container.get(base))).not.toContain('a');
      expect(container.get(withA).a).toBe('a');
      expect(Object.keys(container.get(withA))).not.toContain('b');
      expect(container.get(withB).b).toBe('b');
      expect(Object.keys(container.get(withB))).not.toContain('a');
    });
  });
});

describe('store identity', () => {
  it('gives two definitions with the same key their own store', () => {
    const first = defineKeyedSignal(() => 'first', { key: 'shared' });
    const second = defineKeyedSignal(() => 'second', { key: 'shared' });

    inContainer((container) => {
      expect(container.get(first)()).toBe('first');
      expect(container.get(second)()).toBe('second');
    });
  });
});

describe('inject', () => {
  it('throws a StateBuilderError that names the cycle', () => {
    const a: ReturnType<typeof defineSignal<number>> = defineKeyedSignal(
      () => 1,
      {
        key: 'a',
      },
    ).extend((_, context) => {
      context.inject(b);
    });
    const b: ReturnType<typeof defineSignal<number>> = defineKeyedSignal(
      () => 2,
      {
        key: 'b',
      },
    ).extend((_, context) => {
      context.inject(a);
    });

    inContainer((container) => {
      expect(() => container.get(a)).toThrow(StateBuilderError);
      expect(() => container.get(a)).toThrow('a -> b -> a');
    });
  });

  it('still resolves a definition after a failed cycle', () => {
    const plain = defineSignal(() => 3);
    inContainer((container) => {
      expect(container.get(plain)()).toBe(3);
    });
  });
});
