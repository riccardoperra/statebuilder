---
'statebuilder': minor
---

Bundle the plugin engine (pluggino) into the build and update the toolchain to Vite 8, Vitest 5, TypeScript 7 and tsdown. `solid-js` is now a peer dependency. Inside a plugin, `context.hooks.onInit` and `context.hooks.onDestroy` are replaced by `context.onMount` and `context.onDispose`.
