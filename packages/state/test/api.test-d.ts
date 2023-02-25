import { describe, expect, expectTypeOf, test, vi } from 'vitest';
import { $CREATOR, create, makePlugin } from '~/api';
import { createRoot, createSignal, Setter } from 'solid-js';
import { Container } from '~/container';
import { SetStoreFunction } from 'solid-js/store';
import { defineSignal, Signal } from '~/solid/signal';
import { defineStore, Store, StoreValue } from '~/solid/store';
import { GenericStoreApi } from '~/types';
import { withProxyCommands } from '~/plugins/commands';
import { withReduxDevtools } from '~/plugins/devtools';
import { withAsyncAction } from '~/plugins/asyncAction';

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
  test('make plugin supported only by store definition', () => {
    const onlyStorePlugin = makePlugin.typed<Store<{ count: number }>>()(
      (store) => {
        expectTypeOf(store.set).toMatchTypeOf<
          SetStoreFunction<{ count: number }>
        >();
        return {
          fromStore: 1,
        };
      },
      { name: 'countSetter' },
    );

    // @ts-expect-error mismatch type
    defineSignal(() => ({ count: 1 })).extend(onlyStorePlugin);

    defineStore(() => ({ count: 1 })).extend(onlyStorePlugin);
  });

  test('make plugin supported only by signal definition', () => {
    const onlySignalPlugin = makePlugin(
      (store: Signal<{ count: number }>) => {
        expectTypeOf(store.set).toMatchTypeOf<Setter<{ count: number }>>();
      },
      { name: 'countSetter' },
    );

    defineSignal(() => ({ count: 1 })).extend(onlySignalPlugin);

    defineStore(() => ({ count: 1 })).extend(onlySignalPlugin);

    // @ts-expect-error Value not matching
    defineSignal(() => ({ anotherProp: '' })).extend(onlySignalPlugin);
  });

  test('make plugin supported only by custom definition', () => {
    type Custom<TState extends StoreValue> = GenericStoreApi<
      TState,
      (...args: any[]) => any
    > & {
      log: () => void;
    };

    const defineCustom = create('custom', <T>(value: T) => {
      const accessor = vi.fn();
      const set = vi.fn();
      return Object.assign(accessor, {
        set,
        log() {
          console.log('ok');
        },
      });
    });

    const onlyCustomPlugin = makePlugin.typed<Custom<number>>()(
      (store) => {
        expectTypeOf(store.set).toMatchTypeOf<Setter<{ count: number }>>();
        return {};
      },
      { name: 'countSetter' },
    );

    defineCustom(1).extend(onlyCustomPlugin);
    // @ts-expect-error not matching type
    defineSignal(() => ({ count: 1 })).extend(onlyCustomPlugin);
    // @ts-expect-error not matching type
    defineStore(() => ({ count: 1 })).extend(onlyCustomPlugin);
  });
});

describe('extend', () => {
  test('infer with multiple plugin extensions', () => {
    defineSignal(() => 1)
      .extend(withAsyncAction())
      .extend(withProxyCommands<{ increment: void }>())
      .extend(withReduxDevtools({ storeName: 'store' }))
      .extend((ctx) => {
        expectTypeOf(ctx.set).toEqualTypeOf<Setter<number>>();
        expectTypeOf(ctx).toHaveProperty('commands');
        expectTypeOf(ctx).toHaveProperty('asyncAction');
      });
  });

  test('infer with (ctx) -> {} signature', () => {
    defineSignal(() => 1)
      .extend((ctx) => ({ doubleCount: () => ctx() * 2 }))
      .extend((ctx) => {
        expectTypeOf(ctx.doubleCount).toEqualTypeOf<() => number>();
      });
  });

  test('infer with Plugin signature', () => {
    function plugin<TGenericApi extends GenericStoreApi>(
      ctx: TGenericApi,
    ): { set2: TGenericApi['set'] } {
      return {
        set2: ctx.set,
      };
    }
    const withPlugin = makePlugin((state) => plugin(state), {
      name: 'plugin',
    });

    defineSignal(() => 1)
      .extend(withPlugin)
      .extend((ctx) => {
        expectTypeOf(ctx.set2).toMatchTypeOf<Setter<number>>();
      });
  });

  test('infer with (ctx) -> Plugin signature', () => {
    defineSignal(() => 1)
      .extend(
        makePlugin(
          (ctx) => ({
            set2: ctx.set,
          }),
          { name: 'test' },
        ),
      )
      .extend((ctx) => {
        expectTypeOf(ctx.set2).toEqualTypeOf<Setter<number>>();
      });
  });
});
