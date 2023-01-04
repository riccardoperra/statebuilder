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
        console.log(payload);
        await new Promise(r => setTimeout(r, 3000));
        ctx.set('count', count => count + 1);
        return `${payload} - test`;
      }),
    };
  });

export default function Counter() {
  const store = provideState($store);

  createEffect(() => console.log('loadign', store.incrementAfter1S.loading));

  return (
    <>
      <button
        class='increment'
        onClick={() => store.set('count', count => count + 1)}>
        Clicks: {store().count}
      </button>

      <button
        class='increment'
        onClick={() => store.incrementAfter1S()}>
        After 1 sec
      </button>
    </>

  );
}
