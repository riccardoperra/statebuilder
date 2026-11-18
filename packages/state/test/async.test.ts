import { describe, expect, it } from 'vitest';
import { createRoot, flush, isPending, resolve } from 'solid-js';
import { $CREATOR, Container, defineAsync } from '../src';

interface Todo {
  id: number;
  title: string;
}

function deferred<T>() {
  let release!: (value: T) => void;
  const promise = new Promise<T>((r) => (release = r));
  return { promise, release };
}

describe('defineAsync', () => {
  it('should define state with params', () => {
    const def = defineAsync(async () => ({ id: 1, title: 'title' }) as Todo);

    expect(def[$CREATOR]).toBeDefined();
  });

  it('is not readable until the source resolves', async () => {
    const request = deferred<Todo>();
    const store = createRoot(() =>
      Container.create().get(defineAsync(() => request.promise)),
    );

    expect(() => store()).toThrow();

    request.release({ id: 1, title: 'title' });

    expect(await resolve(() => store())).toEqual({ id: 1, title: 'title' });
    expect(store()).toEqual({ id: 1, title: 'title' });
  });

  it('writes a value over the fetched one', async () => {
    const store = createRoot(() =>
      Container.create().get(defineAsync(async () => 1)),
    );
    await resolve(() => store());

    store.set(5);

    expect(store.peek()).toBe(5);
    flush();
    expect(store()).toBe(5);
  });

  it('runs the source again on refetch and keeps the value meanwhile', async () => {
    let calls = 0;
    let request = deferred<number>();
    const store = createRoot(() =>
      Container.create().get(
        defineAsync(() => {
          calls++;
          return request.promise;
        }),
      ),
    );
    request.release(1);
    await resolve(() => store());

    request = deferred<number>();
    store.refetch();
    flush();

    expect(calls).toBe(2);
    expect(store()).toBe(1);

    request.release(2);
    await request.promise;
    await Promise.resolve();
    flush();

    expect(store()).toBe(2);
    expect(isPending(() => store())).toBe(false);
  });

  it('notifies onSet with the written value', async () => {
    const writes: unknown[] = [];
    const store = createRoot(() =>
      Container.create().get(
        defineAsync(async () => 1).extend((_, context) => {
          context.onSet((value) => writes.push(value));
        }),
      ),
    );
    await resolve(() => store());

    store.set(9);

    expect(writes).toEqual([9]);
  });
});
