/*
 * Copyright 2025 Riccardo Perra
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { describe, expect, it, vi } from 'vitest';
import { createRoot } from 'solid-js';
import { Container, type SetMeta } from '../src';
import { defineSignal } from './utils/signal';
import { defineStore } from './utils/store';

function inRoot<T>(fn: (container: Container) => T) {
  return createRoot((dispose) => ({
    result: fn(Container.create()),
    dispose,
  }));
}

describe('onSet', () => {
  it('passes the state after each write and an empty meta', () => {
    const calls: [number, SetMeta][] = [];
    const Counter = defineSignal(() => 0).extend((_, context) => {
      context.onSet((value, meta) => calls.push([value, meta]));
    });

    const { result: counter } = inRoot((container) => container.get(Counter));
    counter.set(1);
    counter.set((count) => count + 1);

    expect(calls).toEqual([
      [1, {}],
      [2, {}],
    ]);
  });

  it('passes the store state after a path write', () => {
    const values: { count: number }[] = [];
    const Counter = defineStore(() => ({ count: 0 })).extend((_, context) => {
      context.onSet((value) => values.push({ ...value }));
    });

    const { result: counter } = inRoot((container) => container.get(Counter));
    counter.set('count', 5);

    expect(values).toEqual([{ count: 5 }]);
  });

  it('runs listeners synchronously in registration order', () => {
    const order: string[] = [];
    const Counter = defineSignal(() => 0)
      .extend((_, context) => {
        context.onSet(() => order.push('first'));
      })
      .extend((_, context) => {
        context.onSet(() => order.push('second'));
      });

    const { result: counter } = inRoot((container) => container.get(Counter));
    counter.set(1);
    order.push('after set');

    expect(order).toEqual(['first', 'second', 'after set']);
  });

  it('stops calling a listener after it unsubscribes', () => {
    const listener = vi.fn();
    const Counter = defineSignal(() => 0).extend((_, context) => ({
      off: context.onSet(listener),
    }));

    const { result: counter } = inRoot((container) => container.get(Counter));
    counter.set(1);
    counter.off();
    counter.set(2);

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('stops calling listeners once the store is disposed', () => {
    const listener = vi.fn();
    const Counter = defineSignal(() => 0).extend((_, context) => {
      context.onSet(listener);
    });

    const { result: counter, dispose } = inRoot((container) =>
      container.get(Counter),
    );
    dispose();
    counter.set(1);

    expect(listener).not.toHaveBeenCalled();
  });

  it('notifies once when a plugin overrides set and calls the previous one', () => {
    const calls: number[] = [];
    const Counter = defineSignal(() => 0)
      .extend((_, context) => {
        context.onSet((value) => calls.push(value));
      })
      .extend((store) => {
        const previous = store.set;
        return { set: (value: number) => previous(Math.max(0, value)) };
      });

    const { result: counter } = inRoot((container) => container.get(Counter));
    counter.set(-3);
    counter.set(4);

    expect(calls).toEqual([0, 4]);
  });

  it('notifies when an overriding set does not call the previous one', () => {
    const calls: number[] = [];
    let external = 0;
    const Counter = defineSignal(() => 0)
      .extend((_, context) => {
        context.onSet((value) => calls.push(value));
      })
      .extend(() => ({
        set: (value: number) => {
          external = value;
        },
      }));

    const { result: counter } = inRoot((container) => container.get(Counter));
    counter.set(7);

    expect(external).toBe(7);
    expect(calls).toEqual([0]);
  });
});

describe('runInAction', () => {
  it('sets meta.action for writes inside the callback and returns its result', () => {
    const metas: SetMeta[] = [];
    const Counter = defineSignal(() => 0).extend((store, context) => {
      context.onSet((_, meta) => metas.push(meta));
      return {
        add: (amount: number) =>
          context.runInAction({ name: 'add', args: [amount] }, () => {
            store.set((count) => count + amount);
            return 'done';
          }),
      };
    });

    const { result: counter } = inRoot((container) => container.get(Counter));
    expect(counter.add(2)).toBe('done');
    counter.set(0);

    expect(metas).toEqual([{ action: { name: 'add', args: [2] } }, {}]);
  });

  it('reports the innermost action and restores the outer one', () => {
    const names: (string | undefined)[] = [];
    const Counter = defineSignal(() => 0).extend((store, context) => {
      context.onSet((_, meta) => names.push(meta.action?.name));
      return {
        outer: () =>
          context.runInAction({ name: 'outer', args: [] }, () => {
            store.set(1);
            context.runInAction({ name: 'inner', args: [] }, () =>
              store.set(2),
            );
            store.set(3);
          }),
      };
    });

    const { result: counter } = inRoot((container) => container.get(Counter));
    counter.outer();

    expect(names).toEqual(['outer', 'inner', 'outer']);
  });

  it('restores the previous action when the callback throws', () => {
    const metas: SetMeta[] = [];
    const Counter = defineSignal(() => 0).extend((store, context) => {
      context.onSet((_, meta) => metas.push(meta));
      return {
        fail: () =>
          context.runInAction({ name: 'fail', args: [] }, () => {
            throw new Error('boom');
          }),
      };
    });

    const { result: counter } = inRoot((container) => container.get(Counter));
    expect(() => counter.fail()).toThrow('boom');
    counter.set(1);

    expect(metas).toEqual([{}]);
  });

  it('is scoped to its store: writes to another store carry no action', () => {
    const otherMetas: SetMeta[] = [];
    const Other = defineSignal(() => 0).extend((_, context) => {
      context.onSet((_, meta) => otherMetas.push(meta));
    });
    const Counter = defineSignal(() => 0).extend((store, context) => {
      const other = context.inject(Other);
      return {
        both: () =>
          context.runInAction({ name: 'both', args: [] }, () => {
            store.set(1);
            other.set(1);
          }),
      };
    });

    const { result: counter } = inRoot((container) => container.get(Counter));
    counter.both();

    expect(otherMetas).toEqual([{}]);
  });
});
