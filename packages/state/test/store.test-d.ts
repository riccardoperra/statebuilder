import { describe, expectTypeOf, test } from 'vitest';
import { defineStore } from '../src';
import { Store, StoreDefinitionCreator } from '~/solid/store';
import { Accessor, createSignal } from 'solid-js';

interface Todo {
  name: string;
  id: number;
}

describe('defineStore', () => {
  test('infer initial value type', () => {
    const $def = defineStore(() => ({ name: 'test', id: 1 }));
    expectTypeOf($def).toMatchTypeOf<
      StoreDefinitionCreator<Todo, Store<Todo>, {}>
    >();
  });

  test('infer type with extensions', () => {
    const $def = defineStore(() => ({ name: 'test', id: 1 })).extend((ctx) => {
      const [signal, setSignal] = createSignal(true);
      return {
        dispatch() {},
        signal,
      };
    });

    type Test = StoreDefinitionCreator<
      Todo,
      Store<Todo>,
      {
        dispatch: () => void;
        signal: Accessor<boolean>;
      }
    >;

    expectTypeOf($def).toMatchTypeOf<Test>();
  });

  test('infer context while building', () => {
    defineStore(() => ({ name: 'test', id: 1 }))
      .extend((ctx) => {
        return {
          dispatch() {},
        };
      })
      .extend((ctx) => {
        type Test = Store<{ name: string; id: number }> & {
          dispatch: () => void;
        };
        expectTypeOf(ctx).toMatchTypeOf<Test>();
      });
  });
});
