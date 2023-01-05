import './Counter.css';
import { defineStore, provideState, withAsyncAction } from '../../../../src';
import { createEffect } from 'solid-js';

const $store = defineStore({
  count: 0,
})
  .extend(withAsyncAction())
  .extend(ctx => {
    return {
      incrementAfter1S: ctx.asyncAction(async (payload: number) => {
        await new Promise(r => setTimeout(r, 3000));
        ctx.set('count', count => count + 1);
        return payload;
      }),
    };
  });

export default function Counter() {
  const store = provideState($store);

  createEffect(() => {
    console.log('loading state', store.incrementAfter1S.loading);
    console.log('latest value', store.incrementAfter1S.latestValue);
  });

  return (
    <>
      <button
        class='increment'
        onClick={() => store.set('count', count => count + 1)}>
        Clicks: {store().count}
      </button>

      <button
        class='increment'
        disabled={store.incrementAfter1S.loading}
        onClick={() => store.incrementAfter1S()}>
        Increment after 1 sec
      </button>
    </>

  );
}
