import './Counter.css';
import { defineStore, provideState } from 'statebuilder';
import { withProxyCommands } from 'statebuilder/commands';
import { withReduxDevtools } from 'statebuilder/devtools';
import { withAsyncAction } from 'statebuilder/asyncAction';
import { withReducer } from 'statebuilder/reducer';

type Increment = { type: 'increment'; payload: number };

type Decrement = { type: 'decrement'; payload: number };

type AppActions = Increment | Decrement;

type AppState = {
  count: number;
};

function appReducer(state: AppState, action: AppActions) {
  switch (action.type) {
    case 'increment':
      return { ...state, count: state.count + action.payload };
    case 'decrement':
      return { ...state, count: state.count - action.payload };
    default:
      return state;
  }
}

const $store = defineStore(() => ({
  count: 0,
}))
  .extend(withAsyncAction())
  .extend(withProxyCommands<{ increment: void }>())
  .extend(withReduxDevtools({ storeName: 'countStore' }))
  .extend(withReducer(appReducer))
  .extend((ctx) => {
    ctx.hold(ctx.commands.increment, () =>
      ctx.set('count', (count) => count + 1),
    );
    return {
      incrementAfter1S: ctx.asyncAction(async (payload: number) => {
        await new Promise((r) => setTimeout(r, 3000));
        ctx.set('count', (count) => count + 1);
        return payload;
      }),
    };
  });

export default function Counter() {
  const store = provideState($store);

  return (
    <>
      <button
        class="increment"
        onClick={() => store.actions.increment()}
      >
        Clicks: {store().count}
      </button>

      <button
        class="increment"
        disabled={store.incrementAfter1S.loading}
        onClick={() => store.incrementAfter1S()}
      >
        Increment after 1 sec
      </button>

      <button
        class="increment"
        onClick={() => store.dispatch({ type: 'increment', payload: 1 })}
      >
        Increment with reducer
      </button>
    </>
  );
}
