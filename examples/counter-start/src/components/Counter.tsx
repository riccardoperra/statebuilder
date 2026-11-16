import './Counter.css';
import {
  defineSignal,
  defineStore,
  StoreProvider,
  useStore,
} from 'statebuilder';
import { withActions } from 'statebuilder/actions';
import { withDevtools } from 'statebuilder/devtools';
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
  context.onMount(() => console.log('init count2'));
  context.onDispose(() => console.log('destroy count2'));
});

const CountStore = defineStore(() => ({
  count: 0,
}))
  .extend(withAsyncAction())
  .extend(
    withActions((state) => ({
      increment() {
        state.set('count', (count) => count + 1);
      },
    })),
  )
  .extend(withDevtools({ name: 'countStore' }))
  .extend(withReducer(appReducer))
  .extend((state, context) => {
    context.onMount(() => console.log('init'));
    context.onDispose(() => console.log('destroy'));

    return {
      incrementAfter1S: state.asyncAction(async (payload: number) => {
        await new Promise((r) => setTimeout(r, 3000));
        state.set('count', (count) => count + 1);
        return payload;
      }),
    };
  });

function Counter() {
  const store = useStore(CountStore);
  const globalCount = useStore(GlobalCount);

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
  return (
    <StoreProvider provide={[CountStore]}>
      <Counter />
    </StoreProvider>
  );
}
