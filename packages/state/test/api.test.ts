import { describe, expect, test, vi } from 'vitest';
import { $EXTENSION, $NAME, create, makePlugin, resolve } from '../src/api';
import { createRoot, createSignal } from 'solid-js';
import { Container } from '../src/container';
import { GenericStoreApi } from '~/types';
import { SetStoreFunction } from 'solid-js/store';
import { defineStore } from '~/store';
import { defineSignal } from '~/signal';

const container = createRoot(() => Container.create());

describe('create', () => {
  test('custom counter signal that accepts only positive numbers', () => {
    const notify = vi.fn().mockName('set callback mock');

    const creatorFn = create('custom', (initialValue?: number) => {
      const [state, setState] = createSignal(initialValue ?? 0);
      return Object.assign(state, {
        set: (value: number) => {
          if (value < 0) return;
          notify();
          setState(value);
        },
      });
    });

    const definition = creatorFn(1).extend((ctx) => ({
      decrement: () => ctx.set(ctx() - 1),
    }));

    expect(definition[$EXTENSION]).length(1);
    expect(definition[$NAME]).toEqual('custom-1');

    const state = container.get(definition);

    expect(state()).toEqual(1);

    state.set(0);

    expect(state()).toEqual(0);

    state.decrement();
    state.set(-1);

    expect(state()).toEqual(0);

    expect(notify).toHaveBeenCalledTimes(1);
  });
});

describe('makePlugin', () => {
  test('make plugin with custom name', () => {
    const withCountSetter = makePlugin(
      <
        S extends GenericStoreApi<
          { count: number },
          SetStoreFunction<{ count: number }>
        >,
      >(
        store: S,
      ) => ({
        increment: () => store.set('count', (count) => count + 1),
      }),
      { name: 'countSetter' },
    );

    const state = defineStore(() => ({ count: 0 })).extend(withCountSetter);

    const store = Container.create().get(state);

    expect(withCountSetter.name).toEqual('countSetter');
    expect(withCountSetter.apply).toBeDefined();
    expect(store).toHaveProperty('increment');
  });
});

describe('resolve', () => {
  test('resolve definition', () => {
    const pluginApply = vi.fn();

    const state = defineSignal(() => 0)
      .extend((api) => {
        pluginApply();
        return {
          decrement: () => api.set(api() - 1),
        };
      })
      .extend((api) => {
        pluginApply();
        return {
          increment: () => api.set(api() - 1),
        };
      });

    const store = resolve(state);

    expect(pluginApply).toHaveBeenCalledTimes(2);
    expect(store).toHaveProperty('increment');
    expect(store).toHaveProperty('decrement');
  });

  test('will skip setters with invalid type', () => {
    const setFn = vi.fn();
    const state = defineSignal(() => 0)
      .extend((api) => {
        return {
          set: 1,
        };
      })
      .extend({
        name: 'custom',
        apply(api, options) {
          const originalSet = api.set;
          const set: typeof originalSet = setFn;
          return {
            set,
          };
        },
      });

    const store = resolve(state);
    expect(store).toHaveProperty('set');
    expect(store.set).toBeInstanceOf(Function);

    store.set(10);

    expect(setFn).toHaveBeenCalledWith(10);
  });
});
