import './Counter.css';
import { defineSignal, defineStore, provideState } from 'statebuilder';
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

const GlobalCount = defineSignal(() => 1).extend((_, context) => {
  context.hooks.onInit(() => console.log('init count2'));
  context.hooks.onDestroy(() => console.log('destroy count2'));
});

const CountStore = defineStore(() => ({
  count: 0,
}))
  .extend(withAsyncAction())
  .extend(
    withProxyCommands<{ increment: void }>({
      devtools: { storeName: 'counter' },
    }),
  )
  .extend(withReduxDevtools({ storeName: 'countStore' }))
  .extend(withReducer(appReducer))
  .extend((state, context) => {
    state.hold(state.commands.increment, () =>
      state.set('count', (count) => count + 1),
    );

    context.hooks.onInit(() => console.log('init'));
    context.hooks.onDestroy(() => console.log('destroy'));

    return {
      incrementAfter1S: state.asyncAction(async (payload: number) => {
        await new Promise((r) => setTimeout(r, 3000));
        state.set('count', (count) => count + 1);
        return payload;
      }),
    };
  });

function Counter() {
  'use stateprovider';
  const store = provideState(CountStore);
  const globalCount = provideState(GlobalCount);

  return (
    <>
      <button
        class="increment"
        onClick={() => globalCount.set((count) => count + 1)}
      >
        Global Count Clicks: {globalCount()}
      </button>

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

export default function CounterRoot() {
  'use stateprovider';
  const globalCount = GlobalCount;
  return <Counter />;
}
