import { describe, expect, it, vi } from 'vitest';
import { createRoot } from 'solid-js';
import { Container, defineSignal } from '../../src';
import { withAsyncAction } from '../../src/plugins/asyncAction';

const flush = () => new Promise((resolve) => setTimeout(resolve));

function setup<P, R>(fn: (payload: P) => Promise<R>) {
  const definition = defineSignal(() => 0)
    .extend(withAsyncAction())
    .extend((store) => ({ run: store.asyncAction(fn) }));
  return createRoot(() => Container.create().get(definition));
}

describe('asyncAction', () => {
  it('exposes the resolved value as the latestValue property', async () => {
    const store = setup(async (n: number) => n * 2);

    expect(store.run.latestValue).toBeUndefined();
    store.run(2);
    expect(store.run.loading).toBe(true);
    await flush();

    const latestValue: number | undefined = store.run.latestValue;
    expect(store.run.loading).toBe(false);
    expect(latestValue).toBe(4);
  });

  it('exposes a rejection as error and raises no unhandled rejection', async () => {
    const failure = new Error('boom');
    const onUnhandled = vi.fn();
    process.once('unhandledRejection', onUnhandled);
    const store = setup(async () => {
      throw failure;
    });

    store.run();
    await flush();
    await flush();
    process.off('unhandledRejection', onUnhandled);

    expect(onUnhandled).not.toHaveBeenCalled();
    expect(store.run.loading).toBe(false);
    expect(store.run.error).toBe(failure);
  });

  it('clears error when the next call succeeds', async () => {
    let fail = true;
    const store = setup(async () => {
      if (fail) throw new Error('boom');
      return 'ok';
    });

    store.run();
    await flush();
    fail = false;
    store.run();
    await flush();

    expect(store.run.error).toBeUndefined();
    expect(store.run.latestValue).toBe('ok');
  });
});
