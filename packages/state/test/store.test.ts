import { createEffect, createRoot, flush } from 'solid-js';
import { describe, expect, it, vi } from 'vitest';
import { Container, defineStore } from '../src';
import { $CREATOR } from '@statebuilder/container';

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

describe('Store', () => {
  describe('defineState', () => {
    it('should define state with params', () => {
      const def = defineStore<Todo>(() => ({
        id: 1,
        title: 'title',
        completed: false,
      }));

      expect(def[$CREATOR]).toBeDefined();
    });

    it('should define state with extension', () => {
      const def = defineStore<Todo>(() => ({
        id: 1,
        title: 'title',
        completed: false,
      }))
        .extend((ctx) => {})
        .extend((ctx) => {});

      expect(def[$CREATOR].composer.context.plugins.length).toEqual(2);
    });
  });

  const container = Container.create();

  it('should create store', () => {
    const store = container.get(
      defineStore<Todo>(() => ({
        id: 0,
        completed: true,
        title: '',
      })),
    );

    expect(store).toBeDefined();

    expect(store()).toEqual({
      id: 0,
      completed: true,
      title: '',
    });

    store.set((state) => {
      state.id += 1;
      state.completed = false;
    });

    expect(store.peek()).toEqual({ id: 1, completed: false, title: '' });
    expect(store.get.id).toBe(0);

    flush();

    expect(store.get).toEqual({
      id: 1,
      completed: false,
      title: '',
    });
  });

  it('replaces the top level keys when the setter returns a value', () => {
    const store = container.get(
      defineStore<{ a?: number; b: number }>(() => ({ a: 1, b: 2 })),
    );

    store.set(() => ({ b: 3 }));
    flush();

    expect(store()).toEqual({ b: 3 });
  });

  it('restores an earlier peek, nested writes included, and keeps identity', () => {
    const store = container.get(
      defineStore(() => ({
        frame: { padding: 0 },
        rows: [{ id: 1 }],
      })),
    );
    const before = store.peek();
    const frame = store.get.frame;
    const row = store.get.rows[0];

    store.set((state) => {
      state.frame.padding = 3;
      state.rows.push({ id: 2 });
    });
    flush();
    const after = store.peek();

    store.set(() => before);
    flush();

    expect(store.peek()).toEqual({ frame: { padding: 0 }, rows: [{ id: 1 }] });
    expect(store.get.frame).toBe(frame);
    expect(store.get.rows[0]).toBe(row);
    expect(after).toEqual({
      frame: { padding: 3 },
      rows: [{ id: 1 }, { id: 2 }],
    });

    store.set(() => after);
    flush();

    expect(store.get.frame.padding).toBe(3);
    expect(store.get.rows).toHaveLength(2);
  });

  it('should react to changes', () => {
    const completedFn = vi.fn().mockName('completedFn');
    const idFn = vi.fn().mockName('idFn');
    const accessorFn = vi.fn().mockName('accessorFn');
    const titleFn = vi.fn().mockName('titleFn');

    const store = container.get(
      defineStore<Todo>(() => ({
        id: 0,
        completed: true,
        title: 'initial',
      })),
    );

    expect(store).toBeDefined();

    const dispose = createRoot((dispose) => {
      createEffect(() => store.get.completed, completedFn);
      createEffect(() => store.get.id, idFn);
      createEffect(() => store.get.title, titleFn);
      createEffect(() => store(), accessorFn);
      return dispose;
    });
    flush();

    store.set((state) => {
      state.completed = false;
    });
    flush();

    store.set((state) => {
      state.title = 'updated';
    });
    flush();

    store.set((state) => {
      state.title = 'updated again';
    });
    flush();

    expect(store.get).toEqual({
      id: 0,
      completed: false,
      title: 'updated again',
    });

    expect(completedFn).toHaveBeenCalledTimes(2);
    expect(titleFn).toHaveBeenCalledTimes(3);
    expect(idFn).toHaveBeenCalledTimes(1);
    expect(accessorFn).toHaveBeenCalledTimes(4);
    dispose();
  });
});
