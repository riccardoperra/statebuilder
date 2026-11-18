---
'statebuilder': minor
---

`statebuilder/commands` keeps `withProxyCommands`, `hold`, `commands`, `actions`, `dispatch` and `watchCommand`, with these changes:

- `hold` also takes an object with one handler per command. TypeScript reports a command left without a handler.
- `watchCommand` takes `{ phase: 'before' | 'after' }` and emits typed commands with `identity`, `consumerValue` and `phase`. The `@@BEFORE/name` and `@@AFTER/name` commands are removed: replace `watchCommand(/@@BEFORE\/name/)` with `watchCommand([store.commands.name], { phase: 'before' })`.
- `watchCommand()` with no filter emits once per dispatch.
- `untrackCommand` is synchronous by default, restores tracking when the callback throws, and hides the command from every watcher. Pass `true` as second argument to stay untracked until the next microtask.
- The `devtools` option opens one Redux DevTools instance per store, named `storeName`, and sends the command name as the action type.
- In development, dispatching a command of the store that has no handler logs a warning.
- Removed from the command object: `execute`, `with`, `clone`, `executionDate`. Removed exports: `track`, `makeCommandNotifier`, `createTrackObserver`.
- The `@solid-primitives/event-bus` dependency is removed.
