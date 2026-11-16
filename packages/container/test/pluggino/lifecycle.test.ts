import { describe, expect, test, vi } from 'vitest';
import { Composer, createPlugin, resolve } from '../../src/pluggino/index.js';

describe('plugin lifecycle options', () => {
  test('onMount runs after every plugin is applied', () => {
    const onMount = vi.fn();
    const composer = new Composer<{}>().with(
      createPlugin(() => ({ value: 1 }), { name: 'p', onMount }),
    );

    resolve(composer, {}, {});

    expect(onMount).toHaveBeenCalledTimes(1);
  });

  test('onDispose runs when the composed object is disposed', () => {
    const onDispose = vi.fn();
    const composer = new Composer<{}>().with(
      createPlugin(() => ({ value: 1 }), { name: 'p', onDispose }),
    );

    const composed = resolve(composer, {}, {});
    expect(onDispose).not.toHaveBeenCalled();
    composed.dispose();

    expect(onDispose).toHaveBeenCalledTimes(1);
  });
});

describe('Composer', () => {
  test('with returns a new composer and keeps the original plugin list', () => {
    const base = new Composer<{}>();
    const extended = base.with(() => ({ value: 1 }));

    expect(extended).not.toBe(base);
    expect(base.context.plugins).toHaveLength(0);
    expect(extended.context.plugins).toHaveLength(1);
  });
});
