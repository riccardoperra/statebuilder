import { describe, expect, expectTypeOf, it } from 'vitest';
import { createRoot, flush } from 'solid-js';
import { Container, defineSignal, defineStore } from 'statebuilder';
import { withEntities } from '../src/with-entities';

interface Todo {
  id: number;
  title: string;
  done: boolean;
}

const initial = (): Todo[] => [
  { id: 1, title: 'write docs', done: false },
  { id: 2, title: 'ship', done: false },
];

const kinds = {
  defineStore: () =>
    defineStore(initial).extend(withEntities({ selectId: (todo) => todo.id })),
  defineSignal: () =>
    defineSignal(initial).extend(withEntities({ selectId: (todo) => todo.id })),
};

describe.each(Object.entries(kinds))('withEntities on %s', (_, define) => {
  const setup = () => {
    const definition = define();
    return createRoot(() => Container.create().get(definition));
  };

  it('finds an entity by id', () => {
    const todos = setup();

    expectTypeOf(todos.entities.byId).parameter(0).toEqualTypeOf<number>();
    expect(todos.entities.byId(2)?.title).toBe('ship');
    expect(todos.entities.byId(3)).toBeUndefined();
  });

  it('adds an entity at the end', () => {
    const todos = setup();

    todos.entities.add({ id: 3, title: 'rest', done: false });
    flush();

    expect(todos().map((todo) => todo.id)).toEqual([1, 2, 3]);
  });

  it('updates an entity with a patch or a function', () => {
    const todos = setup();

    todos.entities.update(1, { done: true });
    todos.entities.update(2, (todo) => ({ ...todo, title: 'ship it' }));
    flush();

    expect(todos()).toEqual([
      { id: 1, title: 'write docs', done: true },
      { id: 2, title: 'ship it', done: false },
    ]);
  });

  it('removes an entity', () => {
    const todos = setup();

    todos.entities.remove(1);
    flush();

    expect(todos().map((todo) => todo.id)).toEqual([2]);
  });

  it('upsert replaces an existing entity and appends a new one', () => {
    const todos = setup();

    todos.entities.upsert({ id: 2, title: 'ship v2', done: true });
    todos.entities.upsert({ id: 4, title: 'new', done: false });
    flush();

    expect(todos()).toEqual([
      { id: 1, title: 'write docs', done: false },
      { id: 2, title: 'ship v2', done: true },
      { id: 4, title: 'new', done: false },
    ]);
  });
});

describe('withEntities types', () => {
  it('rejects a store whose state is not an array', () => {
    // @ts-expect-error the state must be an array of entities
    defineStore(() => ({ id: 1 })).extend(withEntities({ selectId: () => 1 }));
  });
});
