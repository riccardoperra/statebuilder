import { describe, expect, it } from 'vitest';
import { defineStore } from '../../src';
import { createCommand, withProxyCommands } from '../../src/plugins/commands';
import { Container } from '../../src';
import { createRoot } from 'solid-js';

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
    withProxyCommands<Commands>(),
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
      .extend(withProxyCommands<Commands>())
      .extend((ctx) => {
        ctx.hold(ctx.commands.setFirstName, (_, { set }) =>
          set('firstName', _),
        );
        expect({ ...ctx.actions }).toHaveProperty('setFirstName');
        return ctx.actions;
      });
    container.get(config);
  });
});

describe('command payload', () => {
  function setup() {
    const definition = defineStore(() => ({ value: null as unknown })).extend(
      withProxyCommands<{ setValue: unknown }>(),
    );
    return createRoot(() => Container.create().get(definition));
  }

  it('dispatches a payload that JSON cannot serialize', () => {
    const store = setup();
    const circular: { self?: unknown } = {};
    circular.self = circular;
    let received: unknown;
    store.hold(store.commands.setValue, (payload) => {
      received = payload;
    });

    store.actions.setValue(circular);

    expect(received).toBe(circular);
  });

  it('keeps the payload identity in the @@AFTER command', () => {
    const store = setup();
    const payload = { date: new Date(0) };
    const after: any[] = [];
    store.watchCommand(/@@AFTER/).subscribe((command) => after.push(command));

    store.actions.setValue(payload);

    expect(after).toHaveLength(1);
    expect(after[0].correlate.consumerValue).toBe(payload);
  });
});
