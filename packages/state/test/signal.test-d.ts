import { describe, expectTypeOf, test } from 'vitest';
import { defineSignal, makePlugin } from '../src';
import { Signal, SignalDefinitionCreator } from '~/solid/signal';
import { Accessor, createSignal } from 'solid-js';

describe('defineSignal', () => {
  test('infer initial value type', () => {
    const $def = defineSignal(() => 1);
    expectTypeOf($def).toMatchTypeOf<
      SignalDefinitionCreator<number, Signal<number>, {}>
    >();
  });

  test('infer type with extensions', () => {
    const $def = defineSignal(() => 1).extend((ctx) => {
      const [signal, setSignal] = createSignal(true);
      return {
        dispatch() {},
        signal,
      };
    });

    type Test = SignalDefinitionCreator<
      number,
      Signal<number>,
      {
        dispatch: () => void;
        signal: Accessor<boolean>;
      }
    >;

    expectTypeOf($def).toMatchTypeOf<Test>();
  });

  test('infer type with generics', () => {
    const plugin = <T>() =>
      makePlugin(
        (store) => ({
          outer: {} as T,
        }),
        { name: 'test ' },
      );
    const $def = defineSignal(() => 1).extend(plugin<{ data: number }>());

    type Test = SignalDefinitionCreator<
      number,
      Signal<number>,
      {
        outer: { data: number };
      }
    >;

    expectTypeOf($def).toMatchTypeOf<Test>();
  });

  test('infer context while building', () => {
    defineSignal(() => ({ name: 'test', id: 1 }))
      .extend((ctx) => {
        return {
          dispatch() {},
        };
      })
      .extend((ctx) => {
        type Test = Signal<{ name: string; id: number }> & {
          dispatch: () => void;
        };
        expectTypeOf(ctx).toMatchTypeOf<Test>();
      })
      .extend((ctx) => {});
  });
});
