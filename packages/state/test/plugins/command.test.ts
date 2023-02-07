import { describe, expect, it } from 'vitest';
import { defineStore } from '~/store';
import { createCommand, withProxyCommands } from '~/plugins/commands';
import { Container } from '~/container';
import { withPlugin } from '~/api';

type Commands = {
  setFirstName: string;
  setLastName: string;
};

describe('createCommand', () => {
  it('should create command', () => {
    const command = createCommand('test').withPayload<string>();

    expect(command.identity).toEqual('test');
  });

  it('should have valuated command value payload', () => {
    const command = createCommand('test')
      .withPayload<string>()
      .execute('value');

    expect(command.identity).toEqual('test');
    expect(command.consumerValue).toEqual('value');
  });

  it('should merge props', () => {
    const command = createCommand('test')
      .withPayload<string>()
      .with({ silent: true })
      .with({ async: false })
      .execute('1');

    expect(command.identity).toEqual('test');
    expect(command.silent).toEqual(true);
    expect(command.async).toEqual(false);
    expect(command.consumerValue).toEqual('1');
  });
});

describe('proxyCommand', () => {
  const container = Container.create();

  const initialObject = {
    firstName: 'Mario',
    lastName: 'Rossi',
  };

  const config = defineStore(() => initialObject).extend(
    withPlugin((ctx) => withProxyCommands.of(ctx).with<Commands>()),
  );

  const store = container.get(config);

  store.hold(store.commands.setFirstName, (payload, { state }) => {
    return { ...state, firstName: payload };
  });

  store.hold(store.commands.setLastName, (payload, { state }) => {
    return { ...state, lastName: payload };
  });

  it('should update state', () => {
    store.actions.setFirstName('updated');
    store.actions.setLastName('updated 2');
    expect(store.get.firstName).toBe('updated');
    expect(store.get.lastName).toBe('updated 2');
    expect(store()).toEqual({
      firstName: 'updated',
      lastName: 'updated 2',
    });
  });

  it('should not lose proxied getters while spreading', () => {
    function $innerStore() {
      return { ...store.actions };
    }

    const innerStore = $innerStore();

    innerStore.setFirstName('updated');
    expect(store.get.firstName).toBe('updated');
  });

  it('should have available proxy in context extend callback', function () {
    const config = defineStore(() => initialObject)
      .extend(withPlugin((ctx) => withProxyCommands.of(ctx).with<Commands>()))
      .extend(
        (ctx) => {
          ctx.hold(ctx.commands.setFirstName, (_, { set }) =>
            set('firstName', _),
          );
          expect({ ...ctx.actions }).toHaveProperty('setFirstName');
          return ctx.actions;
        },
      );
    container.get(config);
  });
});
