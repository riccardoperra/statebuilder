---
'statebuilder': minor
---

Breaking changes for users of 0.8:

| 0.8                                                | Now                                                   |
| -------------------------------------------------- | ----------------------------------------------------- |
| `StateProvider`, `provideState`, `getStateContext` | `StoreProvider`, `useStore`, `useContainer`           |
| `makePlugin`                                       | `createPlugin`                                        |
| `ɵdefineResource`, `ɵWithResourceStorage`          | `defineAsync`, `withResourceStorage`                  |
| `withReduxDevtools({ storeName })`                 | `withDevtools({ name })` from `statebuilder/devtools` |
| `Container.create(owner, parent)`                  | `Container.create({ owner, parent, provide })`        |

- A store lives in the root `StoreProvider` unless a nested provider lists it: `<StoreProvider provide={[EditorStore]}>`.
- The `'use stateprovider'` directive and the `experimental.transformStateProviderDirective` compiler option are removed.
- `withActions` from `statebuilder/actions` is a new way to define named actions. `statebuilder/commands` is unchanged.
