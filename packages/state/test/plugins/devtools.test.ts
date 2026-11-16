import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRoot } from 'solid-js';
import { Container, defineSignal, defineStore } from '../../src';
import { withActions } from '../../src/plugins/actions';
import { withDevtools, type DevtoolsMessage } from '../../src/plugins/devtools';

const snapshot = (state: unknown) => JSON.parse(JSON.stringify(state));

function installFakeExtension() {
  const sent: { action: unknown; state: unknown }[] = [];
  const inits: unknown[] = [];
  let listener: ((message: DevtoolsMessage) => void) | undefined;
  const connect = vi.fn(() => ({
    init: (state: unknown) => inits.push(snapshot(state)),
    send: (action: unknown, state: unknown) =>
      sent.push({ action, state: snapshot(state) }),
    subscribe: (cb: (message: DevtoolsMessage) => void) => {
      listener = cb;
      return () => (listener = undefined);
    },
    unsubscribe: () => (listener = undefined),
  }));
  window.__REDUX_DEVTOOLS_EXTENSION__ = { connect };
  return {
    connect,
    sent,
    inits,
    get connected() {
      return listener !== undefined;
    },
    jump(state: unknown, type = 'JUMP_TO_STATE') {
      listener?.({
        type: 'DISPATCH',
        payload: { type },
        state: JSON.stringify(state),
      });
    },
  };
}

const FrameStore = defineStore(() => ({ padding: 64 }))
  .extend(
    withActions((store) => ({
      setPadding(padding: number) {
        store.set('padding', padding);
      },
    })),
  )
  .extend(withDevtools({ name: 'frame' }));

function resolveFrame() {
  return createRoot((dispose) => ({
    frame: Container.create().get(FrameStore),
    dispose,
  }));
}

afterEach(() => {
  delete window.__REDUX_DEVTOOLS_EXTENSION__;
});

describe('withDevtools', () => {
  it('connects with the given name and sends the initial state', () => {
    const extension = installFakeExtension();
    resolveFrame();

    expect(extension.connect).toHaveBeenCalledWith({ name: 'frame' });
    expect(extension.inits).toEqual([{ padding: 64 }]);
  });

  it('sends a set entry for a write outside an action', () => {
    const extension = installFakeExtension();
    const { frame } = resolveFrame();

    frame.set('padding', 10);

    expect(extension.sent).toEqual([
      { action: { type: 'set', payload: undefined }, state: { padding: 10 } },
    ]);
  });

  it('sends the action name and args for a write inside an action', () => {
    const extension = installFakeExtension();
    const { frame } = resolveFrame();

    frame.actions.setPadding(32);

    expect(extension.sent).toEqual([
      {
        action: { type: 'setPadding', payload: [32] },
        state: { padding: 32 },
      },
    ]);
  });

  it.each(['JUMP_TO_STATE', 'JUMP_TO_ACTION', 'ROLLBACK'])(
    '%s writes the state back without sending an entry',
    (type) => {
      const extension = installFakeExtension();
      const { frame } = resolveFrame();

      extension.jump({ padding: 5 }, type);

      expect(frame()).toEqual({ padding: 5 });
      expect(extension.sent).toEqual([]);
    },
  );

  it('works with a signal', () => {
    const extension = installFakeExtension();
    const Counter = defineSignal(() => 0).extend(
      withDevtools({ name: 'counter' }),
    );
    const counter = createRoot(() => Container.create().get(Counter));

    counter.set(1);
    extension.jump(7);

    expect(counter()).toBe(7);
    expect(extension.sent).toEqual([
      { action: { type: 'set', payload: undefined }, state: 1 },
    ]);
  });

  it('disconnects when the store is disposed', () => {
    const extension = installFakeExtension();
    const { frame, dispose } = resolveFrame();

    dispose();
    frame.set('padding', 1);

    expect(extension.connected).toBe(false);
    expect(extension.sent).toEqual([]);
  });

  it('does nothing without the extension', () => {
    const { frame } = resolveFrame();

    frame.actions.setPadding(1);

    expect(frame()).toEqual({ padding: 1 });
  });
});
