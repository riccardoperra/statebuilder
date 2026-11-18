import { describe, expect, it, vi } from 'vitest';
import { createEffect, createRoot, createSignal, flush } from 'solid-js';
import { Container, defineSignal, defineStore, type SetMeta } from '../../src';
import { withActions } from '../../src/plugins/actions';

function inRoot<T>(fn: (container: Container) => T) {
  return createRoot((dispose) => ({
    result: fn(Container.create()),
    dispose,
  }));
}

const FrameStore = defineStore(() => ({ padding: 64, visible: true })).extend(
  withActions((store) => ({
    setPadding(padding: number) {
      store.set((state) => {
        state.padding = padding;
      });
    },
    toggleVisibility() {
      store.set((state) => {
        state.visible = !state.visible;
      });
    },
  })),
);

describe('withActions', () => {
  it('runs the actions on the store', () => {
    const { result: frame } = inRoot((container) => container.get(FrameStore));

    frame.actions.setPadding(32);
    frame.actions.toggleVisibility();
    flush();

    expect(frame()).toEqual({ padding: 32, visible: false });
  });

  it('passes the return value through', () => {
    const Counter = defineSignal(() => 1).extend(
      withActions((store) => ({
        double() {
          return store.set((count) => count * 2);
        },
        async load() {
          return 'loaded';
        },
      })),
    );
    const { result: counter } = inRoot((container) => container.get(Counter));

    expect(counter.actions.double()).toBe(2);
    expect(counter.actions.double.silent()).toBe(4);
    return expect(counter.actions.load()).resolves.toBe('loaded');
  });

  it('gives the factory the plugin context', () => {
    const metas: SetMeta[] = [];
    const Counter = defineSignal(() => 0).extend(
      withActions((store, context) => {
        context.onSet((_, meta) => metas.push(meta));
        return { increment: () => store.set((count) => count + 1) };
      }),
    );
    const { result: counter } = inRoot((container) => container.get(Counter));

    counter.actions.increment();

    expect(metas).toEqual([{ action: { name: 'increment', args: [] } }]);
  });

  it('calls onAction after the action by default, with name and args', () => {
    const { result: frame } = inRoot((container) => container.get(FrameStore));
    const events: unknown[] = [];
    frame.onAction('setPadding', (event) =>
      events.push({ ...event, padding: frame.peek().padding }),
    );

    frame.actions.setPadding(32);
    frame.actions.toggleVisibility();

    expect(events).toEqual([{ name: 'setPadding', args: [32], padding: 32 }]);
  });

  it('calls before listeners before the action runs', () => {
    const { result: frame } = inRoot((container) => container.get(FrameStore));
    const seen: number[] = [];
    frame.onAction('setPadding', () => seen.push(frame().padding), {
      phase: 'before',
    });

    frame.actions.setPadding(32);

    expect(seen).toEqual([64]);
  });

  it('listens to a list of names or to every action', () => {
    const { result: frame } = inRoot((container) => container.get(FrameStore));
    const listed: string[] = [];
    const all: string[] = [];
    frame.onAction(['setPadding', 'toggleVisibility'], ({ name }) =>
      listed.push(name),
    );
    frame.onAction(({ name }) => all.push(name));

    frame.actions.setPadding(1);
    frame.actions.toggleVisibility();

    expect(listed).toEqual(['setPadding', 'toggleVisibility']);
    expect(all).toEqual(['setPadding', 'toggleVisibility']);
  });

  it('does not call onAction listeners for a silent call', () => {
    const { result: frame } = inRoot((container) => container.get(FrameStore));
    const listener = vi.fn();
    frame.onAction(listener);
    frame.onAction(listener, { phase: 'before' });

    frame.actions.setPadding.silent(10);

    expect(frame.peek().padding).toBe(10);
    expect(listener).not.toHaveBeenCalled();
  });

  it('stops calling a listener after unsubscribe', () => {
    const { result: frame } = inRoot((container) => container.get(FrameStore));
    const listener = vi.fn();
    const off = frame.onAction(listener);

    frame.actions.setPadding(1);
    off();
    frame.actions.setPadding(2);

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes on cleanup of the owner that called onAction', () => {
    const { result: frame } = inRoot((container) => container.get(FrameStore));
    const listener = vi.fn();
    const disposeListener = createRoot((dispose) => {
      frame.onAction(listener);
      return dispose;
    });

    frame.actions.setPadding(1);
    disposeListener();
    frame.actions.setPadding(2);

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('applies the writes of an action together: effects see only the final state', () => {
    const Point = defineSignal(() => ({ x: 0, y: 0 })).extend(
      withActions((store) => ({
        move(x: number, y: number) {
          store.set((point) => ({ ...point, x }));
          store.set((point) => ({ ...point, y }));
        },
      })),
    );
    const { result: point } = inRoot((container) => container.get(Point));
    const seen: unknown[] = [];
    createRoot(() =>
      createEffect(
        () => point(),
        (value) => void seen.push(value),
      ),
    );
    flush();

    point.actions.move(1, 2);
    flush();

    expect(seen).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 2 },
    ]);
  });

  it('runs the action untracked', () => {
    const [source, setSource] = createSignal(0);
    const Counter = defineSignal(() => 0).extend(
      withActions((store) => ({
        readSource() {
          return source() + store();
        },
      })),
    );
    const { result: counter } = inRoot((container) => container.get(Counter));
    const runs = vi.fn();
    createRoot(() =>
      createEffect(
        () => {
          runs();
          return counter.actions.readSource();
        },
        () => {},
      ),
    );
    flush();

    setSource(5);
    flush();

    expect(runs).toHaveBeenCalledTimes(1);
  });

  it('marks writes with the innermost action', () => {
    const names: (string | undefined)[] = [];
    const Counter = defineSignal(() => 0).extend(
      withActions((store, context) => {
        context.onSet((_, meta) => names.push(meta.action?.name));
        return {
          reset() {
            store.set(0);
          },
          resetAndAdd(amount: number) {
            this.reset();
            store.set((count) => count + amount);
          },
        };
      }),
    );
    const { result: counter } = inRoot((container) => container.get(Counter));

    counter.actions.resetAndAdd(3);
    flush();

    expect(counter()).toBe(3);
    expect(names).toEqual(['reset', 'resetAndAdd']);
  });

  it('merges the actions of two withActions and onAction sees both', () => {
    const Counter = defineSignal(() => 0)
      .extend(
        withActions((store) => ({
          increment() {
            store.set((count) => count + 1);
          },
        })),
      )
      .extend(
        withActions((store) => ({
          incrementTwice() {
            store.actions.increment();
            store.actions.increment();
          },
        })),
      );
    const { result: counter } = inRoot((container) => container.get(Counter));
    const names: string[] = [];
    counter.onAction(({ name }) => names.push(name));

    counter.actions.incrementTwice();
    flush();

    expect(counter()).toBe(2);
    expect(names).toEqual(['increment', 'increment', 'incrementTwice']);
  });

  it('does not call after listeners when the action throws', () => {
    const Failing = defineSignal(() => 0).extend(
      withActions(() => ({
        fail(): void {
          throw new Error('boom');
        },
      })),
    );
    const { result: failing } = inRoot((container) => container.get(Failing));
    const listener = vi.fn();
    failing.onAction(listener);

    expect(() => failing.actions.fail()).toThrow('boom');
    expect(listener).not.toHaveBeenCalled();
  });

  it('keeps the listeners of each store instance apart', () => {
    const first = inRoot((container) => container.get(FrameStore)).result;
    const second = inRoot((container) => container.get(FrameStore)).result;
    const listener = vi.fn();
    first.onAction(listener);

    second.actions.setPadding(1);

    expect(listener).not.toHaveBeenCalled();
  });
});
