import { describe, expectTypeOf, it, test } from 'vitest';
import {
  createCommand,
  ExecutedStateCommand,
  StateCommand,
} from '../../src/plugins/commands';

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

  it('infer executed state', function () {
    const command = createCommand('test')
      .withPayload<string>()
      .execute('value');

    expectTypeOf(command).toMatchTypeOf<
      ExecutedStateCommand<'test', string, StateCommand<'test', string>>
    >();
  });
});
