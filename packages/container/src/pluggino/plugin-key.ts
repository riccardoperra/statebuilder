import type { PluginContext } from "./plugin.js";

/**
 * @internal
 */
export const $PLUGIN_KEY: unique symbol = Symbol("plugin.key");

/**
 * @internal
 */
export const $PLUGIN_META: unique symbol = Symbol("plugin.meta");

/**
 * @public Plugin key interface
 */
export interface PluginKey<T, TMeta> {
  readonly ɵtype: T;
  readonly ɵmeta: PluginKeyMeta<TMeta>;
  readonly [$PLUGIN_KEY]: PluginKeyMeta<TMeta>;

  getMeta: (context: PluginContext) => TMeta;
}

/**
 * @internal
 */
export type PluginKeyMeta<T> = symbol & {
  readonly [$PLUGIN_META]: T;
};

/**
 * Creates a plugin key used to uniquely identify and manage a plugin.
 *
 * @public
 */
export function makePluginKey<T, TMeta>(
  key: string = "key",
): PluginKey<T, TMeta> {
  return {
    [$PLUGIN_KEY]: makePluginMeta<TMeta>(key),
    ɵtype: undefined as T,
    get ɵmeta() {
      return this[$PLUGIN_KEY];
    },
    getMeta(context: PluginContext) {
      return context.getMeta(this);
    },
  };
}

/**
 * Creates a plugin metadata key tied to a specific identifier.
 *
 * @param {string} key - The unique identifier for the plugin meta. Defaults to "key".
 *
 * @public
 */
export function makePluginMeta<TMeta>(
  key: string = "key",
): PluginKeyMeta<TMeta> {
  return Object.assign(Symbol(`plugin.meta/${key}`), {
    [$PLUGIN_META]: undefined as TMeta,
  });
}
