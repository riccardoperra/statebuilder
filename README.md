![Preview](https://assets.solidjs.com/banner?background=blocks&type=Statesolid&project=statesolid)

# statesolid

> **Warning** This library has been built for experimental purposes for my needs while building apps that need an
> agnostic state manager and a certain complexity.

[![NPM](https://img.shields.io/npm/v/statesolid?style=for-the-badge)](https://www.npmjs.com/package/statesolid)

`statesolid` is a state management library built on the top of SolidJS reactivity.

It's built to be an extremely modular system, with an API that allows you to add methods, utilities and custom behaviors
in an easier way. Of course, this come with a built-in TypeScript support.

![Plugin architecture](./plugin-architecture.png)

Solid already provides the primitives to build a state manager system thanks to signals and stores. What's missing is a
well-defined pattern to follow while building your application.

With `statesolid` you can **compose** the approach you like to handle your state and reuse the behaviors across
all your system.

## Usage (Vanilla)

In order to start, the first thing to do is to create a new StateContainer which will store all the states.
Each container saves stores as singletons, so once created the same instance will always be used.

Container must be wrapped into a createRoot in order to create a non-tracked reactive context that can be disposed.
Consider that global state management usually is never disposed, during app lifecycle, but it can be useful in cases of
internal stores.

```ts
// container.ts

import {Container} from 'statesolid';
import {createRoot} from 'solid-js';

export const stateContainer = createRoot(() => Container.create());
```

Once the Container is created, a store can be defined through the `defineStore` function.

The `defineStore` function is used to define a store with a state. The first argument is the initial value of the state.
Next, you can extend your store definition with the `.extend()` method.

```ts
// count.ts

import {defineStore} from 'statesolid';

const countStore = defineStore({count: 0})
  .extend(ctx => ({
    increment: () => ctx.set('count', count => count + 1),
    decrement: () => ctx.set('count', count => count - 1),
  }))
  .extend(withAnotherStateManagement());
```

> **Note** The `.extend()` method is fully typesafe and chainable, allowing you to the use multiple plugin at once.


At the moment we have created only one definition of the state, and it behaves as if it were lazy.
The next step is to initialize it using the container we created earlier.

```ts
// count.ts
import {stateContainer} from './container.ts';
import {createEffect} from 'solid-js';

const state = stateContainer.get(countStore);

// The returned state will inherit all properties returned by the .extend() method 😁
state(); // get the state accessor

state.get.count; // get the count property

state.set('count', count => count++); // set the state manually

state.increment(); // increment;

state.decrement(); // decrement;

createEffect(() => {
  console.log(state.get.count); // called only when count changes
});
```

Since the used primitives came from Solid library, you can use all his api in order to handle the reactivity.

```ts
createEffect(() => {
  console.log(state.get.count) // called only when count changes
})
```

## Usage (Solid)

Before using `statesolid` on SolidJS, it's recommended to mount the `StoreProvider` to your app, ideally at the root.
This is needed to fix an issue with node and SSR while using global state managers.

https://vuejs.org/guide/scaling-up/ssr.html#cross-request-state-pollution

The `StoreProvider` will manage all lifecycles and instances of your store. It act like a `Container`;

```tsx
import {StoreProvider} from 'statesolid';
import {render} from 'solid-js/web';

// Put in your root tree
<StoreProvider>
  <App/>
</StoreProvider>,
```

Once your store definition is ready, you can inject the store in your components by using the `provideState` helper.

```tsx
import {provideState} from 'statesolid';

function Counter() {
  const count = provideState(countStore);
  const state = count.state;

  return (
    <>
      <h1>Count: {state.count}</h1>
      <button onClick={count.increment}>Increment</button>
    </>
  );
}
```

Since these store instances are managed by the `StoreProvider`, state will not be resetted while unmounting the
component.

## Defining plugins (GUIDE) // TODO

As already said, `statesolid` core is powered by a pluggable system. Plugins are basically functions that take a state
context and return a new object with the props to merge.

```ts
interface StoreWithReducer<T, Action> {
  dispatch(action: Action): void;
}

export function withReducer<T extends StoreValue, R>(
  store: Store<T>,
  reducer: (state: T, action: R) => T,
): StoreWithReducer<T, R> {
  return {
    dispatch(action: R) {
      store.set((prevState) => reducer(prevState, action));
    },
  };
}
```

In the example above, we get the state context, a reducer and we return a new object with a dispatch function that will
update the store thanks to the `.set()` method.

Here is an example of what we have created.

```tsx
import {defineStore} from 'statesolid';

type Increment = { type: 'increment'; payload: number };

type Decrement = { type: 'decrement'; payload: number };

type AppActions = Increment | Decrement;

type AppState = {
  counter: number;
}

function appReducer(state: AppState, action: AppActions) {
  switch (action.type) {
    case 'increment':
      return {...state, counter: state.counter + action.payload};
    case 'decrement':
      return {...state, counter: state.counter - action.payload};
    default:
      return state;
  }
}

const appState = defineStore<AppState>(() => ({counter: 0}))
  .extend(context => withReducer(context, appReducer));


function Counter() {
  const {get: state, dispatch} = provideState(appState);

  return (
    <>
      <h1>Count: {state.counter}</h1>
      <button onClick={() => dispatch({type: 'increment', payload: 1})}>
        Increment
      </button>
      <button onClick={() => dispatch({type: 'decrement', payload: 1})}>
        Increment
      </button>
    </>
  );
}
```

And it's not finished because .extend is chainable, so you can add other behaviors indefinitely. For example a reducer
per slice

```ts
import {defineStore, provideState, Store} from 'statesolid';

interface StoreWithReducerSlice<T, SliceName extends keyof T, Action> {
  (): T[SliceName];

  dispatch(action: Action): void;
}

export function withSliceReducer<
  T extends StoreValue,
  SliceName extends keyof T,
  R,
>(
  store: Store<T>,
  slice: SliceName,
  reducer: (state: T[SliceName], action: R) => T[SliceName],
): StoreWithReducerSlice<T, SliceName, R> {
  return {
    [slice]: Object.assign(() => store.get[slice], {
      dispatch(action: R) {
        store.set(slice, (prevState) => reducer(prevState, action));
      },
    }),
  } as unknown as StoreWithReducerSlice<T, SliceName, R>;
}

const appState = defineStore<AppState>(() => ({counter: 0}))
  .extend(context => withSliceReducer(context, 'slice1', slice1Reducer))
  .extend(context => withSliceReducer(context, 'slice2', slice2Reducer))
  .extend(context => withSliceReducer(context, 'slice3', slice2Reducer));

const state = provideState(appState);
state.slice1.dispatch({}); // update only slice1;
state.slice2.dispatch({}); // update only slice2;
state.slice1(); // state.get.slice1
state.slice2(); // state.get.slice2
```

## Built-in plugins

// TODO

- [statesolid/commands](packages/state/src/plugins/commands): state management system with a command-event based
  approach using RXJS
- [statesolid/asyncAction](packages/state/src/plugins/asyncAction.ts): asynchronous actions handler with promise and
  observables

## Demo

https://github.com/riccardoperra/codeimage/blob/main/apps/codeimage/src/state/editor/frame.ts
