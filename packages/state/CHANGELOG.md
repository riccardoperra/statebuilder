# statebuilder

## 0.8.1

### Patch Changes

- 9796bab6794d76eb53ec203407d4094594049c2e: Fix memory leak when unmount solid component

## 0.8.0

### Minor Changes

- 48c76b202466795004f0b5d69b2524a49db40256: add `provide` store syntax helper

## 0.7.8

### Patch Changes

- e1210adb7204931012c50bb5e4ce47738e049e8d: Fix env variables transform

## 0.7.7

### Patch Changes

- 0f7bfb1a8d6ecfb2270f08bdc83a7f557ffa8ad7: remove console.logs in compiler

## 0.7.6

### Patch Changes

- 951a1cedebcfdbbd3c12af8fb4c17675465d6e94: fix missing spread props in babel replace directive

## 0.7.5

### Patch Changes

- 5af8d1eba8b623536012aa57b2f371c254b3eee2: fix vite compiler output folder

## 0.7.4

### Patch Changes

- 5cd657b248c715861b608f38bbf45884593230cb: rename plugin

## 0.7.3

### Patch Changes

- 3d9bd2a3fa122830bdedfca05fc02d1f512a3c8d: Preserve getters while resolving plugins

## 0.7.2

### Patch Changes

- 74b96d77ffe8f1b08d01110bfc4302ecc2e45ce4: State provider replace directive

## 0.7.1

### Patch Changes

- c5c7042: Statebuilder vite plugin with autokey options

## 0.7.0

### Minor Changes

- b57ac51: Add statebuilder vite plugin and dev mode

## 0.6.2

### Patch Changes

- 321645c: fix reactivity - add solid exports

## 0.6.1

### Patch Changes

- 46892dd10b64f0a9c6570a69aad71d153a5cd2ee: add before event to command plugin

## 0.6.0

### Minor Changes

- 3ce5a15: - States will now get resolved using their Container reactive context instead of the context where they are defined.
  - Errors thrown through the state lifecycle will return a `StateBuilderError` class.
  - Add the `remove` method to the Container API to destroy a state
  - Add container hierarchy
  - Export `ɵdefineResource` and`ɵWithResourceStorage` state resource API

## 0.5.0

### Minor Changes

- 8d627ba: feat: allow to inject states inside builders

  Since this version, you can inject other states into plugins (`.extend`).

  ```ts
  const AppState = defineSignal(() => ({}));

  const CounterState = defineSignal(() => 1).extend((_, context) => {
    const appState = context.inject(AppState);
  });
  ```

## 0.4.3

### Patch Changes

- 01b51ae: rework on commands devtools
- ba05d21: improve state commands memory usage

## 0.4.2

### Patch Changes

- 19ef469: missing esm export package.json

## 0.4.1

### Patch Changes

- 1f20a6d: refactor command listener with @solid-primitives/event-bus

## 0.4.0

### Minor Changes

- ffd7c02: feat: store resource

### Patch Changes

- 293f497: perf: refactor commands plugin removing RxJS
- 3af22fa: feat: add store definition init/destroy hooks. support local owner
- 80393f4: feat: command devtools

## 0.3.1

### Patch Changes

- 16fffae: perf: improve type resolution performance

## 0.3.0

### Minor Changes

- 91547c7: feat: refactor types for implicit inference

## 0.2.4

### Patch Changes

- e311052: perf: improve types and documentation

## 0.2.3

### Patch Changes

- 2788c2c: add reducer plugin

## 0.2.2

### Patch Changes

- ef18be4: feat: plugin dependencies support

## 0.2.1

### Patch Changes

- d02e8cc: add devtools plugin

## 0.2.0

### Minor Changes

- 39b6293: add plugin system

### Patch Changes

- ee6ae05: export api core
- dcaed18: improve types, rename $STOREDEF symbol to $CREATOR

## 0.1.0

### Minor Changes

- bccf7b1: Add command-based state plugin
- fb1a817: Refactor core for agnostic and custom stores

### Patch Changes

- cb35d5c: add exports map
- 4dfe1e1: fix command action proxy while spreading
- a8a78aa: improve command typings
- c041c1f: fix build
- 6ad5969: Export store types
- a984ef0: add missing command plugin exports

## 0.1.0-unstable.6

### Patch Changes

- 4dfe1e1: fix command action proxy while spreading

## 0.1.0-unstable.5

### Patch Changes

- a8a78aa: improve command typings

## 0.1.0-unstable.4

### Patch Changes

- c041c1f: fix build

## 0.1.0-unstable.3

### Patch Changes

- a984ef0: add missing command plugin exports

## 0.1.0-unstable.2

### Minor Changes

- bccf7b1: Add command-based state plugin

## 0.0.1-unstable.1

### Patch Changes

- Export store types

## 0.0.1-unstable.0

### Patch Changes

- add exports map
