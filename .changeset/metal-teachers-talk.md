---
'statebuilder': minor
---

- States will now get resolved using their Container reactive context instead of the context where they are defined.
- Errors thrown through the state lifecycle will return a `StateBuilderError` class.
- Add the `remove` method to the Container API to destroy a state
- Add container hierarchy
- Export `ɵdefineResource` and`ɵWithResourceStorage` state resource API
