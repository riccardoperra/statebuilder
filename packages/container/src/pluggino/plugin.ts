/*
 * Copyright 2025 Riccardo Perra
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { $PLUGIN_KEY, PluginKey } from "./plugin-key.js";
import type { WithMeta } from "./meta.js";

/**
 * @public
 * @param o Object to be checked
 */
export function isPlugin(o: {}): o is Plugin {
  return $PLUGIN in o;
}

export interface CorePluginMeta<T> {
  name: string;
  onBeforeMount?: () => void;
  onMount?: () => void;
  onDispose?: () => void;
}

export type PluginMeta<TMeta extends {}> = CorePluginMeta<unknown> & TMeta;

export type Plugin<
  TCallback extends (o: any, context: any) => any = (
    o: any,
    context: any,
  ) => any,
  T = ReturnType<TCallback>,
  TPluginMeta extends Record<string, any> = {},
> = TCallback & {
  [$PLUGIN]: PluginMeta<TPluginMeta & {}>;
  [$PLUGIN_KEY]: PluginKey<T, unknown>;
};

/**
 * @internal Plugin symbol
 */
export const $PLUGIN: unique symbol = Symbol("plugin");

/**
 * @public Plugin context
 */
export interface PluginContext extends WithMeta {
  onMount: (fn: () => void) => void;
  onDispose: (fn: () => void) => void;

  get: <TPluginKey>(
    plugin: PluginKey<TPluginKey, unknown>,
  ) => null | TPluginKey;
}
