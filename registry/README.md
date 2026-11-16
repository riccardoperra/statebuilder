# statebuilder plugin registry

Plugins you copy into your app and edit. They are not published as a package.

Each plugin is one file in [`src/`](./src). It imports only `statebuilder`, `solid-js` and platform APIs such as
`structuredClone`, so it works unchanged once copied. Copy the file, then change it to fit your app. Each file has a
test in [`test/`](./test) that shows its behavior.

Every plugin works with stores from `defineStore` and `defineSignal`. The table lists the limits.

| Plugin                                                         | Store kinds                                        | Depends on                                     |
| -------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------- |
| [`with-persist.ts`](./src/with-persist.ts)                     | `defineStore`, `defineSignal`                      | `statebuilder`, `solid-js`, a storage you pass |
| [`with-history.ts`](./src/with-history.ts)                     | `defineStore`, `defineSignal`                      | `statebuilder`, `solid-js`, `solid-js/store`   |
| [`with-entities.ts`](./src/with-entities.ts)                   | `defineStore`, `defineSignal`, state must be `T[]` | `statebuilder`                                 |
| [`with-optimistic-action.ts`](./src/with-optimistic-action.ts) | `defineStore`, `defineSignal`                      | `statebuilder`, `solid-js`, `solid-js/store`   |
| [`with-source-switch.ts`](./src/with-source-switch.ts)         | `defineStore`, `defineSignal`                      | `statebuilder`, `solid-js`, `solid-js/store`   |

The plugins that copy the state (history, optimistic action, source switch) use `structuredClone`, so the state must
hold plain data: no functions, DOM nodes or class instances.

## How the plugins write the whole state

A `defineStore` store merges an object into its state on `set`, so keys missing from the new value stay. To replace
the state, the history, optimistic action and source switch plugins pass `reconcile(value)` to a `defineStore` store
(it has a `get` property) and `() => value` to a signal. A copy, never the store proxy, is what they keep or send.

## with-persist

Loads the saved state when the store is created and saves it after each write. `storage` can be sync (`localStorage`)
or async (an IndexedDB or cookie wrapper with `getItem`, `setItem` and `removeItem`).

```ts
const SettingsStore = defineStore(() => ({ theme: 'light', draft: '' })).extend(
  withPersist({
    key: 'settings',
    storage: localStorage,
    select: (s) => ({ theme: s.theme }),
  }),
);
const settings = useStore(SettingsStore);
settings.persist.hydrated(); // true once the saved value is read
```

- A sync storage hydrates before the store is returned. An async one hydrates when it answers.
- Hydration does not save the value back. Writes made before an async storage answers are not saved.
- A value that fails to deserialize, or a storage that rejects, leaves the initial state and logs a warning.
- A `defineStore` store merges the saved object into its initial state, so keys added since the value was saved keep
  their initial value. A signal takes the saved value as is, so `select` is for `defineStore` stores.
- `persist.clear()` removes the saved value and leaves the state unchanged.

## with-history

Undo and redo, built on `onSet`. Each write is one step.

```ts
const FrameStore = defineStore(() => ({ padding: 64 })).extend(
  withHistory({ limit: 50 }),
);
const frame = useStore(FrameStore);
frame.set('padding', 32);
frame.history.undo(); // padding is 64
frame.history.canRedo(); // true, reactive
```

- `limit` (default 100) is the number of undo steps kept. The oldest goes first.
- An undo or redo is not recorded as a new step. A new write after an undo drops the redo steps.
- `clear()` forgets every step and keeps the state.

## with-entities

Helpers for a state that is a list of entities with an id.

```ts
const TodoStore = defineStore((): Todo[] => []).extend(
  withEntities({ selectId: (todo) => todo.id }),
);
const todos = useStore(TodoStore);
todos.entities.add({ id: 1, title: 'ship', done: false });
todos.entities.update(1, { done: true });
todos.entities.byId(1); // { id: 1, title: 'ship', done: true }
```

- `update(id, patch)` merges `patch` into the entity. `update(id, fn)` replaces it with what `fn` returns, so `fn` must
  return a new object.
- `add` appends without checking the id. `upsert` replaces the entity with the same id or appends it.

## with-optimistic-action

`store.optimistic(fn)` makes an action that copies the state, runs `fn`, and restores the copy when the promise `fn`
returns rejects. `fn` writes at once and then awaits the request.

```ts
const PresetStore = defineStore(() => ({ presets: [] as Preset[] }))
  .extend(withOptimisticAction())
  .extend((store) => ({
    remove: store.optimistic(async (id: string) => {
      store.set('presets', (presets) =>
        presets.filter((preset) => preset.id !== id),
      );
      await api.deletePreset(id);
    }),
  }));
```

- `remove.loading` and `remove.error` are reactive properties, as in `asyncAction`. A new call clears `error`.
- The action returns a promise that resolves when the call settles. It never rejects: the failure goes to `error`.
- Overlapping calls run one at a time, in call order. A call made while another call on the same store is pending
  starts when that call settles. So a rollback restores the state from just before its own call and never undoes the
  write of another call. The cost is that the second write shows up only after the first request settles.
  `loading` stays true until every call of that action has settled.

## with-source-switch

Loads and saves the state through a local or a remote source, chosen on each call. For an app that keeps data in
IndexedDB for guests and on a server for signed-in users.

```ts
const PresetStore = defineStore((): Preset[] => []).extend(
  withSourceSwitch({
    useRemote: () => auth.loggedIn(),
    local: idbPresets,
    remote: apiPresets,
  }),
);
const presets = useStore(PresetStore);
await presets.source.load(); // from the server when signed in, else from IndexedDB
```

- A source has `load()` and `save(value)`. Both can be sync or async.
- `useRemote` is read when `load` or `save` is called, and `save` goes to the source that is current at that moment.
- `load()` replaces the state with what the source returns. `save()` sends a plain copy of the state.
- `current()` returns `'local'` or `'remote'`. It is reactive when `useRemote` reads a signal.
