import { createEffect, getOwner } from 'solid-js';
import { describe, expect, it, vi } from 'vitest';
import { Container, defineStore } from '../src';
import { $EXTENSION } from '../src/store';

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

describe('Store', () => {

  describe('defineState', () => {
    it('should define state with params', () => {
      const def = defineStore<Todo>({ id: 1, title: 'title', completed: false });

      expect(def.initialValue).toEqual({ id: 1, title: 'title', completed: false });
      expect(def[$EXTENSION].length).toEqual(0);
    });

    it('should define state with extension', () => {
      const def = defineStore<Todo>({ id: 1, title: 'title', completed: false })
        .extend(ctx => {
        })
        .extend(ctx => {
        });

      expect(def.initialValue).toEqual({ id: 1, title: 'title', completed: false });
      expect(def[$EXTENSION].length).toEqual(2);
    });
  });

  const container = new Container(getOwner()!);

  it('should create store', () => {
    const store = container.get(defineStore<Todo>({
      id: 0,
      completed: true,
      title: '',
    }));

    expect(store).toBeDefined();

    expect(store()).toEqual({
      id: 0,
      completed: true,
      title: '',
    });

    store.set(state => Object.assign(state, {
      id: state.id + 1,
      completed: false,
    }));

    expect(store.get).toEqual({
      id: 1,
      completed: false,
      title: '',
    });
  });

  it.skip('should react to changes', () => {
    const completedFn = vi.fn().mockName('completedFn');
    const idFn = vi.fn().mockName('idFn');
    const titleFn = vi.fn().mockName('titleFn');

    const store = container.get(defineStore<Todo>({
      id: 0,
      completed: true,
      title: 'initial',
    }));

    expect(store).toBeDefined();

    createEffect(() => {
      completedFn(store.get.completed);
    });

    createEffect(() => {
      idFn(store.get.id);
    });

    createEffect(() => {
      titleFn(store.get.title);
    });


    store.set(({ completed: false }));

    store.set('title', 'updated');

    store.set('title', 'updated again');

    expect(store.get).toEqual({
      id: 0,
      completed: false,
      title: 'updated again',
    });

    expect(completedFn).toHaveBeenCalledTimes(1);
    expect(titleFn).toHaveBeenCalledTimes(2);
    expect(idFn).toHaveBeenCalledTimes(0);
  });
});
