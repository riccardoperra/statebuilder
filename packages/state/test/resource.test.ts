import { describe, expect, it } from 'vitest';
import { $CREATOR } from '~/api';
import { Container } from '~/container';
import {
  experimental__defineResource,
  experimental__withResourceStorage,
} from '~/solid/resource';
import { createResource, createRoot } from 'solid-js';
import { defineSignal } from '~/solid';

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

describe('Resource', () => {
  it('should define state with params', () => {
    const def = experimental__defineResource(
      () => async () =>
        Promise.resolve({
          id: 1,
          title: 'title',
          completed: false,
        } as Todo),
    );

    expect(def[$CREATOR]).toBeDefined();
  });

  it('should fetch data async', async () => {
    const def = experimental__defineResource(async () => {
      await new Promise((r) => setTimeout(r, 2000));
      return Promise.resolve({
        id: 1,
        title: 'title',
        completed: false,
      } as Todo);
    });

    const container = createRoot(() => Container.create());

    const store = container.get(def);

    expect(store.loading).toBe(true);
    expect(store()).toBe(undefined);

    await new Promise((r) => setTimeout(r, 3000));

    expect(store.loading).toBe(false);
    expect(store()).toEqual({
      id: 1,
      title: 'title',
      completed: false,
    });
  });

  it('should sync store with resource storage', async () => {
    const def = defineSignal(() => 0).extend((store) => {
      const [stateResource, { mutate }] = createResource(
        () => Promise.resolve(5),
        {
          storage: experimental__withResourceStorage(store),
        },
      );
      return {
        stateResource,
        mutate,
      };
    });

    const container = createRoot(() => Container.create());
    const store = container.get(def);

    expect(store()).toBe(0);

    await new Promise((r) => setTimeout(r, 0));

    expect(store()).toBe(5);

    store.mutate(() => 10);
    expect(store()).toBe(10);

    store.set(() => 20);
    expect(store.stateResource()).toBe(20);
  });
});
