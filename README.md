# rstate

`Rstate` is a state management library built on the top of SolidJS reactivity.

Rstate allows the user to extend its functionalities with plugins. This is the main concept of this state manager.

It's built to be an extremely modular system, with an API that allows you to add methods, utilities and custom behaviors
in an easier way.

Of course, this come with a built-in TypeScript support.

![Plugin architecture](./plugin-architecture.png)

Solid already provides the primitives to build a state manaher system thanks to signals and stores. What's missing is a
well defined pattern to follow while building your application.

Rstate thanks to it's modular system allows you to define the approach you prefer to handle your state.

This is the reason you see a `pnpm-lock.yaml`. That being said, any package manager will work. This file can be safely
be removed once you clone a template.

```bash
$ npm install # or pnpm install or yarn install
```

## Usage

Before using `rstate`, you should mount the `StoreProvider` to your app, ideally at the root.

```tsx
import { StoreProvider } from 'rstate';
import { render } from 'solid-js/web';

<StoreProvider>
  <App />
</StoreProvider>
```

The `StoreProvider` will manage all lifecycles and instances of your store.

The `defineStore` function is used to define a store with a state. The first argument is the initial value of the state.
Next, you can extend your store definition with the `.extend()` method.

```ts
import { defineStore } from 'rstate';

const countStore = defineStore({ count: 0 })
  .extend(ctx => ({
    increment: () => ctx.set('count', count => count + 1),
    decrement: () => ctx.set('count', count => count - 1),
  }))
  .extend(withLocalStoragePlugin({ name: '@countStore' }));
```

> **Note** The `.extend()` method is fully typesafe and chainable, allowing you to the use multiple plugin at once.

Once your store definition is ready, you can inject the store in your components by using the `provideState` helper.

```tsx
import { provideState } from './solid';

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

Since these store instances are managed by the `StoreProvider`, state will not be resetted while unmounting the component.
