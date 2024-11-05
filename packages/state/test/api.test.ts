import { describe, expect, it, vi } from 'vitest';
import { $CREATOR, $PLUGIN, create, makePlugin, resolve } from '../src/api';
import { createRoot, createSignal, getOwner } from 'solid-js';
import { Container } from '../src/container';
import { GenericStoreApi } from '~/types';
import { SetStoreFunction } from 'solid-js/store';
import { defineStore } from '~/solid/store';
import { defineSignal } from '~/solid/signal';

const container = createRoot(() => Container.create());

describe('create', () => {
  it('custom counter signal that accepts only positive numbers', () => {
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

    expect(definition[$CREATOR].plugins).length(1);
    expect(definition[$CREATOR].name).toEqual('custom-1');

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
  it('make plugin with custom name', () => {
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
    expect((withCountSetter as any)[$PLUGIN]).toBeDefined();
    expect(store).toHaveProperty('increment');
  });
});

describe('resolve', () => {
  it('resolve definition', () => {
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

  it('will skip setters with invalid type', () => {
    const setFn = vi.fn();
    const state = defineSignal(() => 0)
      .extend((api) => {
        return {
          set: 1,
        };
      })
      .extend((api) => {
        const originalSet = api.set;
        const set: typeof originalSet = setFn as any;
        return {
          set,
        };
      });

    const store = resolve(state);
    expect(store).toHaveProperty('set');
    expect(store.set).toBeInstanceOf(Function);

    store.set(10);

    expect(setFn).toHaveBeenCalledWith(10);
  });

  it('will preserve getters', () => {
    const state = defineSignal(() => 0).extend((api) => {
      return {
        get fooGetter() {
          return 'test';
        },
      };
    });

    const store = resolve(state);
    expect(store).toHaveProperty('fooGetter');
    expect(
      Object.getOwnPropertyDescriptor(store, 'fooGetter')?.get,
    ).toBeDefined();
    expect(Reflect.get(store, 'fooGetter')).toEqual('test');
  });

  it('will throw exception when dependency is missing', () => {
    const plugin1 = makePlugin(() => ({}), {
      name: 'plugin1',
      dependencies: ['missingPlugin'],
    });

    const state = defineSignal(() => 0).extend(plugin1);

    expect(() => resolve(state)).toThrowError(
      `[statebuilder] The dependency 'missingPlugin' of plugin 'plugin1' is missing`,
    );
  });

  it('will listen for hooks after resolution', () => {
    const initHook = vi.fn();
    const destroyHook = vi.fn();

    const state = defineSignal(() => 0)
      .extend((api, context) => {
        context.hooks.onInit(() => initHook('first-plugin'));
        return {};
      })
      .extend((api, context) => {
        context.hooks.onInit(() => initHook('second-plugin'));
        context.hooks.onDestroy(() => destroyHook('destroy'));
        return {};
      });

    createRoot((dispose) => {
      expect(initHook).toHaveBeenCalledTimes(0);
      expect(destroyHook).toHaveBeenCalledTimes(0);

      resolve(state);

      expect(initHook).toHaveBeenCalledTimes(2);
      expect(destroyHook).not.toHaveBeenCalled();

      dispose();

      expect(destroyHook).toHaveBeenCalledWith('destroy');
    });
  });
});

describe('inject', () => {
  const initHook = vi.fn();
  const destroyHook = vi.fn();

  it('should inject state inside another state', () => {
    createRoot((dispose) => {
      const containerState = Container.create(getOwner()!);

      const State1 = defineSignal(() => 0).extend((_, context) => {
        context.hooks.onInit(() => initHook('first-plugin'));
        context.hooks.onDestroy(() => destroyHook('first-plugin'));
      });

      const State2 = defineSignal(() => 1).extend((_, context) => {
        const state1 = context.inject(State1);
        return { state1 };
      });

      const state2 = containerState.get(State2);
      const state1 = containerState.get(State1);

      expect(initHook).toHaveBeenCalledTimes(1);
      expect(state2.state1).toEqual(state1);

      dispose();

      expect(destroyHook).toHaveBeenCalledTimes(1);
    });
  });
});
