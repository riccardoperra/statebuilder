import { describe, expect, it } from 'vitest';
import { createEffect, createRoot } from 'solid-js';
import { Container, defineStore } from '../src';

const flush = () => new Promise((resolve) => setTimeout(resolve));

describe('onSet', () => {
  it('does not subscribe the computation that wrote to what a listener reads', async () => {
    const Counter = defineStore(() => ({ writes: 0, other: 0 })).extend(
      (_, context) => {
        context.onSet((value) => JSON.stringify(value));
      },
    );
    let runs = 0;
    const counter = createRoot(() => {
      const store = Container.create().get(Counter);
      createEffect(() => {
        runs++;
        store.set('writes', (writes) => writes + 1);
      });
      return store;
    });
    await flush();

    counter.set('other', 1);
    await flush();

    expect(runs).toBe(1);
  });
});
