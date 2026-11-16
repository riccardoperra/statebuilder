import { describe, expect, test, vi } from 'vitest';
import {
  Composer,
  createPlugin,
  createSystem,
} from '../../src/pluggino/index.js';

const { resolve } = createSystem();

describe('plugin lifecycle options', () => {
  test('onMount runs after every plugin is applied', () => {
    const onMount = vi.fn();
    const composer = new Composer<{}>().with(
      createPlugin(() => ({ value: 1 }), { name: 'p', onMount }),
    );

    resolve(composer, {}, undefined);

    expect(onMount).toHaveBeenCalledTimes(1);
  });

  test('onDispose runs when the composed object is disposed', () => {
    const onDispose = vi.fn();
    const composer = new Composer<{}>().with(
      createPlugin(() => ({ value: 1 }), { name: 'p', onDispose }),
    );

    const composed = resolve(composer, {}, undefined);
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

describe('createSystem', () => {
  test('createContext and the mount hooks receive the per-call argument', () => {
    const calls: string[] = [];
    const system = createSystem<any>({
      createContext: (args: string) => ({ args }),
      beforePluginMount: (_, plugin, index, args) =>
        calls.push(`before ${plugin.name} ${index} ${args}`),
      afterPluginMount: (_, { result }, index, args) =>
        calls.push(`after ${JSON.stringify(result)} ${index} ${args}`),
    });
    const composer = new Composer<{}>().with(
      createPlugin((_, context: any) => ({ seen: context.args }), {
        name: 'p',
      }),
    );

    const first = system.resolve<{ seen: string }>(composer, {}, 'first');
    const second = system.resolve<{ seen: string }>(composer, {}, 'second');

    expect(first.object.seen).toBe('first');
    expect(second.object.seen).toBe('second');
    expect(calls).toEqual([
      'before p 0 first',
      'after {"seen":"first"} 0 first',
      'before p 0 second',
      'after {"seen":"second"} 0 second',
    ]);
  });

  test('reservedProperties are not copied onto the object', () => {
    const { resolve } = createSystem({ reservedProperties: ['set'] });
    const composer = new Composer<{}>().with(() => ({ set: 1, other: 2 }));

    const { object } = resolve<Record<string, number>>(composer, {}, undefined);

    expect(object).toEqual({ other: 2 });
  });
});
