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

import { $PLUGIN_KEY, $PLUGIN_META } from './plugin-key.js';
import type { PluginKey, PluginKeyMeta } from './plugin-key.js';

/**
 * @public Object that allows to store metadata
 */
export interface WithMeta {
  getMeta: {
    /*
     * Retrieve a metadata property for a given name or plugin.
     *
     * @param key
     */
    <T = any>(key: string): T;
    /*
     * Retrieve a metadata property for a given plugin key.
     *
     * @param key The plugin key
     */
    <TMeta>(key: PluginKey<unknown, TMeta>): TMeta;
    /*
     * Retrieve a metadata property for a given plugin meta-key.
     *
     * @param key The plugin key
     */
    <TMeta>(key: PluginKeyMeta<TMeta>): TMeta;
  };

  setMeta: {
    /**
     * Store a metadata property, keyed by the name
     *
     * @param key The name of the property
     * @param value The value of the property
     */ <T = any>(key: string, value: T): void;
    /**
     * Store a metadata property, keyed by plugin reference
     *
     * @param key The plugin key
     * @param value The value of the property
     */ <TMeta>(key: PluginKey<unknown, TMeta>, value: TMeta): void;
    /**
     * Store a metadata property, keyed by plugin meta reference
     *
     * @param key The plugin key
     * @param value The value of the property
     */ <TMeta>(key: PluginKeyMeta<TMeta>, value: TMeta): void;
  };
}

/**
 * @internal
 */
export type MetaStore = Record<PropertyKey, unknown>;

/**
 * @internal
 */
export const getMeta: WithMeta['getMeta'] = function getMeta(
  this: MetaStore,
  ...args:
    | [key: string]
    | [key: PluginKey<unknown, unknown>]
    | [key: PluginKeyMeta<unknown>]
) {
  const arg = args[0];
  if (typeof arg === 'string') return this[arg];
  if ($PLUGIN_META in arg) return this[arg];
  if ($PLUGIN_KEY in arg) return this[arg.ɵmeta];
  return null;
} satisfies WithMeta['getMeta'];

/**
 * @internal
 */
export const setMeta: WithMeta['setMeta'] = function setMeta(
  this: MetaStore,
  ...args:
    | [key: string, value: any]
    | [key: PluginKey<any, any>, value: any]
    | [key: PluginKeyMeta<any>, value: any]
) {
  if (typeof args[0] === 'string') {
    this[args[0]] = args[1];
    return;
  }
  const arg = args[0];
  if ($PLUGIN_META in arg) {
    this[arg] = args[1];
    return;
  }
  if ($PLUGIN_KEY in arg) {
    this[arg.ɵmeta] = args[1];
    return;
  }
} satisfies WithMeta['setMeta'];
