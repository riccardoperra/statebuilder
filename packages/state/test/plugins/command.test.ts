import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineStore } from '../../src';
import {
  createCommand,
  untrackCommand,
  withProxyCommands,
} from '../../src/plugins/commands';
import type { DevtoolsMessage } from '../../src/plugins/devtools';
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
    expect(store.peek().firstName).toBe('updated');
    expect(store.peek().lastName).toBe('updated 2');
    expect(store.peek()).toEqual({
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
    expect(store.peek().firstName).toBe('updated');
  });

  it('should have available proxy in context extend callback', function () {
    const config = defineStore(() => initialObject)
      .extend(withProxyCommands<Commands>())
      .extend((ctx) => {
        ctx.hold(ctx.commands.setFirstName, (firstName, { set }) =>
          set((state) => {
            state.firstName = firstName;
          }),
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

  it('keeps the payload identity in the watched command', () => {
    const store = setup();
    const payload = { date: new Date(0) };
    const seen: unknown[] = [];
    store
      .watchCommand([store.commands.setValue])
      .subscribe((command) => seen.push(command.consumerValue));

    store.actions.setValue(payload);

    expect(seen).toEqual([payload]);
    expect(seen[0]).toBe(payload);
  });
});

describe('commands and onSet', () => {
  it('reports the command that did the write as meta.action', () => {
    const writes: unknown[] = [];
    const definition = defineStore(() => ({ firstName: '' }))
      .extend(withProxyCommands<{ setFirstName: string }>())
      .extend((store, context) => {
        context.onSet((_, meta) => writes.push(meta.action));
        store.hold(store.commands.setFirstName, (firstName, { set }) =>
          set((state) => {
            state.firstName = firstName;
          }),
        );
      });
    const store = createRoot(() => Container.create().get(definition));

    store.actions.setFirstName('Ada');
    store.set((state) => {
      state.firstName = 'direct';
    });

    expect(writes).toEqual([
      { name: 'setFirstName', args: ['Ada'] },
      undefined,
    ]);
  });
});

function setupCounter() {
  const definition = defineStore(() => ({ count: 0 })).extend(
    withProxyCommands<{ add: number; reset: void }>(),
  );
  const store = createRoot(() => Container.create().get(definition));
  store.hold(store.commands.add, (amount, { set }) =>
    set((state) => {
      state.count += amount;
    }),
  );
  return store;
}

describe('hold', () => {
  it('attaches one handler per command from an object', () => {
    const definition = defineStore(() => ({ count: 0 })).extend(
      withProxyCommands<{ add: number; reset: void }>(),
    );
    const store = createRoot(() => Container.create().get(definition));

    store.hold({
      add: (amount, { set }) =>
        set((state) => {
          state.count += amount;
        }),
      reset: (_, { state }) => ({ ...state, count: 0 }),
    });

    store.actions.add(5);
    expect(store.peek().count).toBe(5);
    store.actions.reset();
    expect(store.peek().count).toBe(0);
  });

  it('runs every handler attached to the same command', () => {
    const store = setupCounter();
    store.hold(store.commands.add, (amount, { set }) =>
      set((state) => {
        state.count += amount;
      }),
    );

    store.actions.add(2);

    expect(store.peek().count).toBe(4);
  });
});

describe('watchCommand', () => {
  it('emits once per dispatch when no filter is given', () => {
    const store = setupCounter();
    const seen: string[] = [];
    store.watchCommand().subscribe((command) => seen.push(command.identity));

    store.actions.add(1);
    store.actions.add(1);

    expect(seen).toEqual(['add', 'add']);
  });

  it('emits after the handlers by default', () => {
    const store = setupCounter();
    const counts: number[] = [];
    store
      .watchCommand([store.commands.add])
      .subscribe(() => counts.push(store.peek().count));

    store.actions.add(3);

    expect(counts).toEqual([3]);
  });

  it('emits before the handlers with the before phase', () => {
    const store = setupCounter();
    const seen: unknown[] = [];
    store
      .watchCommand([store.commands.add], { phase: 'before' })
      .subscribe((command) =>
        seen.push([command.phase, command.consumerValue, store.peek().count]),
      );

    store.actions.add(3);

    expect(seen).toEqual([['before', 3, 0]]);
  });

  it('filters by a regular expression on the command name', () => {
    const store = setupCounter();
    const seen: string[] = [];
    store.watchCommand(/^res/).subscribe((command) => {
      seen.push(command.identity);
    });

    store.actions.add(1);
    store.dispatch(store.commands.reset, undefined);

    expect(seen).toEqual(['reset']);
  });

  it('emits a command created outside the store', () => {
    const store = setupCounter();
    const saved = createCommand('saved').withPayload<void>();
    const seen: string[] = [];
    store.watchCommand([saved]).subscribe((command) => {
      seen.push(command.identity);
    });

    store.dispatch(saved, undefined);

    expect(seen).toEqual(['saved']);
  });

  it('stops emitting after unsubscribe', () => {
    const store = setupCounter();
    const seen: string[] = [];
    const subscription = store
      .watchCommand()
      .subscribe((command) => seen.push(command.identity));

    subscription.unsubscribe();
    store.actions.add(1);

    expect(seen).toEqual([]);
  });
});

describe('untrackCommand', () => {
  it('runs the handlers and hides the command from watchers of both phases', () => {
    const store = setupCounter();
    const seen: string[] = [];
    store.watchCommand().subscribe((command) => seen.push(command.phase));
    store
      .watchCommand(undefined, { phase: 'before' })
      .subscribe((command) => seen.push(command.phase));

    untrackCommand(() => store.actions.add(1));

    expect(store.peek().count).toBe(1);
    expect(seen).toEqual([]);
  });

  it('hides the commands of every store dispatched inside it', () => {
    const first = setupCounter();
    const second = setupCounter();
    const seen: string[] = [];
    first.watchCommand().subscribe(() => seen.push('first'));
    second.watchCommand().subscribe(() => seen.push('second'));

    untrackCommand(() => {
      first.actions.add(1);
      second.actions.add(1);
    });

    expect(seen).toEqual([]);
  });

  it('tracks again as soon as it returns', () => {
    const store = setupCounter();
    const seen: string[] = [];
    store.watchCommand().subscribe((command) => seen.push(command.identity));

    untrackCommand(() => store.actions.add(1));
    store.actions.add(1);

    expect(seen).toEqual(['add']);
  });

  it('tracks again when the callback throws', () => {
    const store = setupCounter();
    const seen: string[] = [];
    store.watchCommand().subscribe((command) => seen.push(command.identity));

    expect(() =>
      untrackCommand(() => {
        throw new Error('boom');
      }),
    ).toThrow('boom');
    store.actions.add(1);

    expect(seen).toEqual(['add']);
  });

  it('stays untracked until the outermost call returns', () => {
    const store = setupCounter();
    const seen: string[] = [];
    store.watchCommand().subscribe((command) => seen.push(command.identity));

    untrackCommand(() => {
      untrackCommand(() => store.actions.add(1));
      store.actions.add(1);
    });

    expect(seen).toEqual([]);
  });

  it('stays untracked until the next microtask when async is true', async () => {
    const store = setupCounter();
    const seen: string[] = [];
    store.watchCommand().subscribe((command) => seen.push(command.identity));

    untrackCommand(() => store.actions.add(1), true);
    store.actions.add(1);
    await Promise.resolve();
    store.actions.add(1);

    expect(seen).toEqual(['add']);
  });
});

describe('commands proxy', () => {
  it('does not create a command for a symbol key', () => {
    const store = setupCounter();

    expect(Reflect.get(store.commands, Symbol.iterator)).toBeUndefined();
    expect(Reflect.get(store.actions, Symbol.iterator)).toBeUndefined();
    expect(Reflect.ownKeys(store.commands)).toEqual(['add']);
  });
});

describe('dispatch without a handler', () => {
  afterEach(() => vi.restoreAllMocks());

  it('warns once in dev for a command declared in the store', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const store = setupCounter();

    store.actions.reset();
    store.actions.reset();

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('"reset"');
  });

  it('does not warn for a command created outside the store', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const store = setupCounter();

    store.dispatch(createCommand('saved').withPayload<void>(), undefined);
    store.actions.add(1);

    expect(warn).not.toHaveBeenCalled();
  });
});

describe('devtools option', () => {
  afterEach(() => {
    delete window.__REDUX_DEVTOOLS_EXTENSION__;
  });

  function installFakeExtension() {
    const sent: { action: unknown; state: unknown }[] = [];
    let listener: ((message: DevtoolsMessage) => void) | undefined;
    const connect = vi.fn(() => ({
      init: () => {},
      send: (action: unknown, state: unknown) =>
        sent.push({ action, state: JSON.parse(JSON.stringify(state)) }),
      subscribe: (cb: (message: DevtoolsMessage) => void) => {
        listener = cb;
        return () => (listener = undefined);
      },
      unsubscribe: () => (listener = undefined),
    }));
    window.__REDUX_DEVTOOLS_EXTENSION__ = { connect };
    return { connect, sent };
  }

  it('sends each command with its name, payload and the new state', () => {
    const extension = installFakeExtension();
    const definition = defineStore(() => ({ count: 0 })).extend(
      withProxyCommands<{ add: number }>({
        devtools: { storeName: 'counter' },
      }),
    );
    const store = createRoot(() => Container.create().get(definition));
    store.hold(store.commands.add, (amount, { set }) =>
      set((state) => {
        state.count += amount;
      }),
    );

    untrackCommand(() => store.actions.add(2));

    expect(extension.connect).toHaveBeenCalledWith({ name: 'counter' });
    expect(extension.sent).toEqual([
      { action: { type: 'add', payload: [2] }, state: { count: 2 } },
    ]);
  });
});
