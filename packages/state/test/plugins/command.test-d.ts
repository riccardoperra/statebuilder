import { describe, expectTypeOf, it, test } from 'vitest';
import {
  createCommand,
  type ExecutedStateCommand,
  StateCommand,
  withProxyCommands,
} from '../../src/plugins/commands';
import { defineSignal, defineStore } from '../../src/solid';
import type { Setter, StoreSetter } from 'solid-js';

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
            StoreSetter<{ count: number }>
          >();
        });
      });
  });

  test('hold with an object infers every handler', () => {
    defineStore(() => ({ count: 1 }))
      .extend(withProxyCommands<{ add: number; reset: void }>())
      .extend((ctx) => {
        ctx.hold({
          add: (amount, context) => {
            expectTypeOf(amount).toEqualTypeOf<number>();
            expectTypeOf(context.state).toEqualTypeOf<{ count: number }>();
          },
          reset: (payload) => {
            expectTypeOf(payload).toEqualTypeOf<void>();
          },
        });

        // @ts-expect-error `reset` has no handler
        ctx.hold({ add: () => {} });

        ctx.hold({
          add: () => {},
          reset: () => {},
          // @ts-expect-error `unknownCommand` is not a command of the store
          unknownCommand: () => {},
        });
      });
  });

  test('watchCommand infers the executed commands', () => {
    defineStore(() => ({ count: 1 }))
      .extend(withProxyCommands<{ add: number; rename: string }>())
      .extend((ctx) => {
        ctx
          .watchCommand([ctx.commands.add, ctx.commands.rename])
          .subscribe((command) => {
            expectTypeOf(command).toEqualTypeOf<
              | ExecutedStateCommand<'add', number>
              | ExecutedStateCommand<'rename', string>
            >();
            if (command.identity === 'add') {
              expectTypeOf(command.consumerValue).toEqualTypeOf<number>();
            }
          });

        ctx.watchCommand().subscribe((command) => {
          expectTypeOf(command).toEqualTypeOf<
            ExecutedStateCommand<string, unknown>
          >();
        });

        ctx.watchCommand(/add/, { phase: 'before' });
      });
  });
});
