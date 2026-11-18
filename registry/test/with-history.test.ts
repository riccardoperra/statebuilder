import { describe, expect, it } from 'vitest';
import { createRoot, flush } from 'solid-js';
import { Container, defineSignal, defineStore } from 'statebuilder';
import { withHistory } from '../src/with-history';

interface Frame {
  frame: { padding: number };
  title?: string;
}

function frameStore(limit?: number) {
  const definition = defineStore<Frame>(() => ({
    frame: { padding: 0 },
  })).extend(withHistory({ limit }));
  const store = createRoot(() => Container.create().get(definition));
  const setPadding = (padding: number) =>
    store.set((state) => {
      state.frame.padding = padding;
    });
  return { store, setPadding };
}

describe('withHistory', () => {
  it('undoes and redoes several writes, nested writes included', () => {
    const { store, setPadding } = frameStore();

    setPadding(1);
    setPadding(2);
    setPadding(3);

    store.history.undo();
    flush();
    expect(store().frame.padding).toBe(2);
    store.history.undo();
    store.history.undo();
    flush();
    expect(store().frame.padding).toBe(0);
    expect(store.history.canUndo()).toBe(false);

    store.history.redo();
    store.history.redo();
    flush();
    expect(store().frame.padding).toBe(2);
    store.history.redo();
    flush();
    expect(store().frame.padding).toBe(3);
    expect(store.history.canRedo()).toBe(false);
  });

  it('keeps the identity of a nested object on undo', () => {
    const { store, setPadding } = frameStore();
    const frame = store.get.frame;

    setPadding(1);
    store.history.undo();
    flush();

    expect(store.get.frame).toBe(frame);
    expect(store.get.frame.padding).toBe(0);
  });

  it('does not record an undo or a redo as a new entry', () => {
    const { store, setPadding } = frameStore();

    setPadding(1);
    setPadding(2);
    store.history.undo();
    store.history.redo();
    store.history.undo();
    store.history.undo();
    flush();

    expect(store().frame.padding).toBe(0);
    expect(store.history.canUndo()).toBe(false);
  });

  it('keeps at most `limit` entries, dropping the oldest', () => {
    const { store, setPadding } = frameStore(2);

    setPadding(1);
    setPadding(2);
    setPadding(3);
    store.history.undo();
    store.history.undo();
    flush();

    expect(store().frame.padding).toBe(1);
    expect(store.history.canUndo()).toBe(false);
  });

  it('drops the redo entries on a new write after an undo', () => {
    const { store, setPadding } = frameStore();

    setPadding(1);
    setPadding(2);
    store.history.undo();
    setPadding(5);
    flush();

    expect(store.history.canRedo()).toBe(false);
    store.history.redo();
    flush();
    expect(store().frame.padding).toBe(5);
    store.history.undo();
    flush();
    expect(store().frame.padding).toBe(1);
  });

  it('removes on undo a key that a later write added', () => {
    const { store } = frameStore();

    store.set((state) => {
      state.title = 'draft';
    });
    store.history.undo();
    flush();

    expect(store()).toEqual({ frame: { padding: 0 } });
  });

  it('clear forgets every entry and keeps the state', () => {
    const { store, setPadding } = frameStore();

    setPadding(1);
    store.history.undo();
    store.history.clear();
    flush();

    expect(store.history.canUndo()).toBe(false);
    expect(store.history.canRedo()).toBe(false);
    expect(store().frame.padding).toBe(0);
  });

  it('restores a value that cannot be cloned, such as a class instance', () => {
    class Point {
      constructor(readonly x: number) {}
      move = (dx: number) => new Point(this.x + dx);
    }
    const definition = defineSignal(() => new Point(0)).extend(withHistory());
    const point = createRoot(() => Container.create().get(definition));

    point.set((p) => p.move(1));
    point.history.undo();
    flush();

    expect(point()).toBeInstanceOf(Point);
    expect(point().x).toBe(0);
  });

  it('works with a signal', () => {
    const definition = defineSignal(() => 'a').extend(withHistory());
    const text = createRoot(() => Container.create().get(definition));

    text.set('b');
    text.set('c');
    text.history.undo();
    text.history.undo();
    flush();

    expect(text()).toBe('a');
    text.history.redo();
    flush();
    expect(text()).toBe('b');
  });
});
