import { describe, expect, it } from 'vitest';
import { createRoot } from 'solid-js';
import { Container, defineSignal, defineStore } from 'statebuilder';
import { withOptimisticAction } from '../src/with-optimistic-action';

function deferred() {
  let resolve!: () => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function presetsStore(request: (name: string) => Promise<void>) {
  const definition = defineStore(() => ({ names: ['a'] }))
    .extend(withOptimisticAction())
    .extend((store) => ({
      add: store.optimistic(async (name: string) => {
        store.set('names', (names) => [...names, name]);
        await request(name);
      }),
    }));
  return createRoot(() => Container.create().get(definition));
}

describe('withOptimisticAction', () => {
  it('applies the write at once and keeps it when the request succeeds', async () => {
    const server = deferred();
    const presets = presetsStore(() => server.promise);

    const done = presets.add('b');

    expect(presets().names).toEqual(['a', 'b']);
    expect(presets.add.loading).toBe(true);
    server.resolve();
    await done;

    expect(presets().names).toEqual(['a', 'b']);
    expect(presets.add.loading).toBe(false);
    expect(presets.add.error).toBeUndefined();
  });

  it('restores the state and sets error when the request rejects', async () => {
    const failure = new Error('offline');
    const presets = presetsStore(() => Promise.reject(failure));

    await presets.add('b');

    expect(presets().names).toEqual(['a']);
    expect(presets.add.loading).toBe(false);
    expect(presets.add.error).toBe(failure);
  });

  it('removes on rollback a key that the optimistic write added', async () => {
    const definition = defineStore((): { draft?: string } => ({}))
      .extend(withOptimisticAction())
      .extend((store) => ({
        save: store.optimistic(async (draft: string) => {
          store.set('draft', draft);
          throw new Error('offline');
        }),
      }));
    const form = createRoot(() => Container.create().get(definition));

    await form.save('hello');

    expect(form()).toEqual({});
  });

  it('runs overlapping calls one at a time, so a rollback undoes only its own write', async () => {
    const requests = new Map<string, ReturnType<typeof deferred>>();
    const presets = presetsStore((name) => {
      const request = deferred();
      requests.set(name, request);
      return request.promise;
    });

    const first = presets.add('b');
    const second = presets.add('c');

    expect(presets().names).toEqual(['a', 'b']);
    expect([...requests.keys()]).toEqual(['b']);

    requests.get('b')!.reject(new Error('conflict'));
    await first;

    expect(presets().names).toEqual(['a', 'c']);
    expect(presets.add.loading).toBe(true);

    requests.get('c')!.resolve();
    await second;

    expect(presets().names).toEqual(['a', 'c']);
    expect(presets.add.loading).toBe(false);
    expect(presets.add.error).toBeUndefined();
  });

  it('works with a signal', async () => {
    const definition = defineSignal(() => 1)
      .extend(withOptimisticAction())
      .extend((store) => ({
        increment: store.optimistic(async () => {
          store.set((count) => count + 1);
          throw new Error('rejected');
        }),
      }));
    const counter = createRoot(() => Container.create().get(definition));

    await counter.increment();

    expect(counter()).toBe(1);
  });
});
