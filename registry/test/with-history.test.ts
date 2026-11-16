import { describe, expect, it } from 'vitest';
import { createRoot } from 'solid-js';
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
  return createRoot(() => Container.create().get(definition));
}

describe('withHistory', () => {
  it('undoes and redoes several writes, nested writes included', () => {
    const store = frameStore();

    store.set('frame', 'padding', 1);
    store.set('frame', 'padding', 2);
    store.set('frame', 'padding', 3);

    store.history.undo();
    expect(store().frame.padding).toBe(2);
    store.history.undo();
    store.history.undo();
    expect(store().frame.padding).toBe(0);
    expect(store.history.canUndo()).toBe(false);

    store.history.redo();
    store.history.redo();
    expect(store().frame.padding).toBe(2);
    store.history.redo();
    expect(store().frame.padding).toBe(3);
    expect(store.history.canRedo()).toBe(false);
  });

  it('does not record an undo or a redo as a new entry', () => {
    const store = frameStore();

    store.set('frame', 'padding', 1);
    store.set('frame', 'padding', 2);
    store.history.undo();
    store.history.redo();
    store.history.undo();
    store.history.undo();

    expect(store().frame.padding).toBe(0);
    expect(store.history.canUndo()).toBe(false);
  });

  it('keeps at most `limit` entries, dropping the oldest', () => {
    const store = frameStore(2);

    store.set('frame', 'padding', 1);
    store.set('frame', 'padding', 2);
    store.set('frame', 'padding', 3);
    store.history.undo();
    store.history.undo();

    expect(store().frame.padding).toBe(1);
    expect(store.history.canUndo()).toBe(false);
  });

  it('drops the redo entries on a new write after an undo', () => {
    const store = frameStore();

    store.set('frame', 'padding', 1);
    store.set('frame', 'padding', 2);
    store.history.undo();
    store.set('frame', 'padding', 5);

    expect(store.history.canRedo()).toBe(false);
    store.history.redo();
    expect(store().frame.padding).toBe(5);
    store.history.undo();
    expect(store().frame.padding).toBe(1);
  });

  it('removes on undo a key that a later write added', () => {
    const store = frameStore();

    store.set('title', 'draft');
    store.history.undo();

    expect(store()).toEqual({ frame: { padding: 0 } });
  });

  it('clear forgets every entry and keeps the state', () => {
    const store = frameStore();

    store.set('frame', 'padding', 1);
    store.history.undo();
    store.history.clear();

    expect(store.history.canUndo()).toBe(false);
    expect(store.history.canRedo()).toBe(false);
    expect(store().frame.padding).toBe(0);
  });

  it('works with a signal', () => {
    const definition = defineSignal(() => 'a').extend(withHistory());
    const text = createRoot(() => Container.create().get(definition));

    text.set('b');
    text.set('c');
    text.history.undo();
    text.history.undo();

    expect(text()).toBe('a');
    text.history.redo();
    expect(text()).toBe('b');
  });
});
