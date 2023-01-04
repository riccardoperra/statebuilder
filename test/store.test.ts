import { createEffect } from 'solid-js';
import { describe, expect, it, vi } from 'vitest';
import { defineStore } from '../src/store';

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

describe('store', () => {
  it('should create store', () => {
    const store = defineStore<Todo>({
      id: 0,
      completed: true,
      title: '',
    });

    expect(store).toBeDefined();

    expect(store.get()).toEqual({
      id: 0,
      completed: true,
      title: '',
    });

    store.set(state => Object.assign(state, {
      id: state.id + 1,
      completed: false,
    }));

    expect(store.state).toEqual({
      id: 1,
      completed: false,
      title: '',
    });
  });

  it('should react to changes', () => {
    const completedFn = vi.fn().mockName('completedFn');
    const idFn = vi.fn().mockName('idFn');
    const titleFn = vi.fn().mockName('titleFn');

    const store = defineStore<Todo>({
      id: 0,
      completed: true,
      title: 'initial',
    });

    expect(store).toBeDefined();

    createEffect(() => {
      completedFn(store.state.completed);
    });

    createEffect(() => {
      idFn(store.state.id);
    });

    createEffect(() => {
      titleFn(store.state.title);
    });


    store.set(({ completed: false }));

    store.set('title', 'updated');

    store.set('title', 'updated again');

    expect(store.state).toEqual({
      id: 0,
      completed: false,
      title: 'updated again',
    });

    expect(completedFn).toHaveBeenCalledTimes(1);
    expect(titleFn).toHaveBeenCalledTimes(2);
    expect(idFn).toHaveBeenCalledTimes(0);
  });
});
