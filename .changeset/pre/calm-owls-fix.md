---
'statebuilder': minor
---

Fix the core bugs found in the review.

- `extend` returns a new definition and no longer changes the one it is called on.
- The container identifies a store by its definition object. Two definitions with the same `key` no longer share a store.
- A circular `inject` throws a `StateBuilderError` that names the cycle.
- The package loads outside Vite.
- `asyncAction` exposes `error`, and `latestValue` is typed as a property.
- A command dispatch no longer serializes the payload with JSON.
