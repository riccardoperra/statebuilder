---
'statebuilder': minor
---

Move to Solid 2. `solid-js` 2 is now the required peer dependency and Solid 1 is no longer supported.

- A write is applied on the next flush, so `store()` and `store.get` return the old state right after `set`. Every store has `peek()`, which returns the state with the pending writes.
- `defineStore`: `set` takes a draft function, as `createStore` does in Solid 2. Path setters such as `set('key', value)` and `set({ partial })` are removed. A function that returns a state replaces the current one, keeps the identity of nested objects that exist on both sides, and restores an earlier `peek()`.
- `defineSignal`: `set` returns the new value.
- `defineAsync` takes an async source and is built on an async signal: `set`, `refetch()`, `peek()`. `createResource` options, `.loading`, `.error` and `withResourceStorage` are removed. Use `<Loading>`, `<Errored>` and `isPending`.
- `onSet` listeners and the `state` of a command handler receive `peek()`. For a store that is a plain snapshot.
- Actions and commands no longer use `batch`, which Solid 2 removed.
- A custom store kind made with `create` must return `peek`.
- Solid 2 throws on a write inside an owned scope (component body, memo, plugin setup). Give a store its first value in the definition.
