import { describe, expect, test, vi } from 'vitest';
import { $EXTENSION, $NAME, create } from '../src/api';
import { createRoot, createSignal } from 'solid-js';
import { Container } from '../src/container';

describe('Api', () => {
  const container = createRoot(() => Container.create());
  describe('create', () => {
    test('custom counter signal that accepts only positive numbers', () => {
      const notify = vi.fn().mockName('set callback mock');

      const creatorFn = create('custom', (initialValue?: number) => {
        const [state, setState] = createSignal(initialValue ?? 0);
        return Object.assign(state, {
          set: (value: number) => {
            if (value < 0) return;
            notify();
            setState(value);
          },
        });
      });

      const definition = creatorFn(1).extend((ctx) => ({
        decrement: () => ctx.set(ctx() - 1),
      }));

      expect(definition[$EXTENSION]).length(1);
      expect(definition[$NAME]).toEqual('custom-1');

      const state = container.get(definition);

      expect(state()).toEqual(1);

      state.set(0);

      expect(state()).toEqual(0);

      state.decrement();
      state.set(-1);

      expect(state()).toEqual(0);

      expect(notify).toHaveBeenCalledTimes(1);
    });
  });
});
