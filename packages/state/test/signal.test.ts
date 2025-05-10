import { createEffect } from 'solid-js';
import { describe, expect, it, vi } from 'vitest';
import { Container, defineSignal } from '../src';
import { $CREATOR } from '@statebuilder/container';

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

describe('Store', () => {
  describe('defineState', () => {
    it('should define state with params', () => {
      const def = defineSignal<Todo>(() => ({
        id: 1,
        title: 'title',
        completed: false,
      }));

      expect(def[$CREATOR]).toBeDefined();
    });

    it('should define state with extension', () => {
      const def = defineSignal<Todo>(() => ({
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
    const storeDef = defineSignal<Todo>(() => ({
      id: 0,
      completed: true,
      title: '',
    }));
    const store = container.get(storeDef);

    expect(store).toBeDefined();

    expect(store()).toEqual({
      id: 0,
      completed: true,
      title: '',
    });

    store.set((state) =>
      Object.assign(state, {
        id: state.id + 1,
        completed: false,
      }),
    );

    expect(store()).toEqual({
      id: 1,
      completed: false,
      title: '',
    });
  });

  it('should react to changes', () => {
    const accessorFn = vi.fn().mockName('accessorFn');

    const store = container.get(
      defineSignal<Todo>(() => ({
        id: 0,
        completed: true,
        title: 'initial',
      })),
    );

    expect(store).toBeDefined();

    createEffect(() => {
      accessorFn(store());
    });

    store.set((prev) => ({ ...prev, completed: false }));

    store.set((prev) => ({ ...prev, title: 'updated' }));

    store.set((prev) => ({ ...prev, title: 'updated again' }));

    expect(store()).toEqual({
      id: 0,
      completed: false,
      title: 'updated again',
    });

    expect(accessorFn).toHaveBeenCalledTimes(4);
  });
});
