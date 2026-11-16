# pluggino

Type-safe object enhancer with a composable plugin system. It is the plugin engine of statebuilder.

This folder has no dependency on Solid or on the rest of `@statebuilder/container`. The container imports it with relative paths, so the build bundles it and no published package depends on `pluggino`.

The code moved here from <https://github.com/riccardoperra/pluggino>. Its tests are in `test/pluggino`.
