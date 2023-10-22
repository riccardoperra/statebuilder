---
"statebuilder": minor
---

feat: allow to inject states inside builders

Since this version, you can inject other states into plugins (`.extend`).

```ts
const AppState = defineSignal(() => ({}));

const CounterState = defineSignal(() => 1)
   .extend((_, context) => {
     const appState = context.inject(AppState);
   })
```
