import { describe, expectTypeOf, it, test } from 'vitest';
import {
  createCommand,
  ExecutedStateCommand,
  StateCommand,
  withProxyCommands,
} from '../../src/plugins/commands';
import { defineSignal, defineStore } from 'src/solid';
import { Setter } from 'solid-js';
import { SetStoreFunction } from 'solid-js/store';

type Commands = {
  setFirstName: string;
  setLastName: string;
};

describe('createCommand', () => {
  test('infer command identity', () => {
    const command = createCommand('test').withPayload<string>();

    expectTypeOf(command).toMatchTypeOf<StateCommand<'test', string>>();
  });

  test('infer multiple payload', () => {
    const command = createCommand('test')
      .withPayload<string>()
      .withPayload<number>()
      .withPayload<() => void>();

    expectTypeOf(command).toMatchTypeOf<
      StateCommand<'test', string | number | (() => void)>
    >();
  });

  it('infer executed state', () => {
    const command = createCommand('test')
      .withPayload<string>()
      .execute('value');

    expectTypeOf(command).toMatchTypeOf<
      ExecutedStateCommand<'test', string, StateCommand<'test', string>>
    >();
  });
});

describe('withProxyCommand', () => {
  test('infer command state/set context', () => {
    defineSignal(() => 1)
      .extend((ctx) => ({ newProp: ctx(), set2: ctx.set }))
      .extend(withProxyCommands<{ increment: boolean }>())
      .extend((ctx) => {
        ctx.hold(ctx.commands.increment, (command, context) => {
          expectTypeOf(command).toEqualTypeOf<boolean>();
          expectTypeOf(context.state).toEqualTypeOf<number>();
          expectTypeOf(context.set).toEqualTypeOf<Setter<number>>();
        });
      });

    defineStore(() => ({ count: 1 }))
      .extend((ctx) => ({ newProp: ctx(), set2: ctx.set }))
      .extend(withProxyCommands<{ increment: boolean }>())
      .extend((ctx) => {
        ctx.hold(ctx.commands.increment, (command, context) => {
          expectTypeOf(command).toEqualTypeOf<boolean>();
          expectTypeOf(context.state).toEqualTypeOf<{ count: number }>();
          expectTypeOf(context.set).toMatchTypeOf<
            SetStoreFunction<{ count: number }>
          >();
        });
      });
  });
});
