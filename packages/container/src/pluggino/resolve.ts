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

import { $PLUGIN } from "./plugin.js";
import { emitter } from "./emitter.js";
import { $PLUGIN_KEY } from "./plugin-key.js";
import { getMeta, setMeta } from "./meta.js";
import type { Plugin, PluginContext } from "./plugin.js";
import type { Emitter } from "./emitter.js";
import type { PluginKey } from "./plugin-key.js";
import type { MetaStore, WithMeta } from "./meta.js";
import type { SystemFactoryTypes } from "./system.js";

export interface ResolveOptions<T, TContext, TPlugin extends Plugin = Plugin> {
  reservedProperties?: Array<string>;
  createContext?: () => TContext;
  beforePluginMount?: InternalEvents<T, TPlugin>[typeof BEFORE_PLUGIN_MOUNT];
  afterPluginMount?: InternalEvents<T, TPlugin>[typeof AFTER_PLUGIN_MOUNT];
}

const DESTROY_EVENT: unique symbol = Symbol("plugin.destroy");
const INIT_EVENT: unique symbol = Symbol("plugin.init");
const BEFORE_PLUGIN_MOUNT: unique symbol = Symbol("plugin.init");
const AFTER_PLUGIN_MOUNT: unique symbol = Symbol("plugin.init");

export interface ComposedObject<T> {
  object: T;
  dispose: () => void;
}

/**
 * @internal
 */
export interface InternalEvents<T, TPlugin extends Plugin> {
  [BEFORE_PLUGIN_MOUNT]: (
    context: ResolvePluginContext<T>,
    plugin: TPlugin,
    index: number,
  ) => void;
  [AFTER_PLUGIN_MOUNT]: (
    context: ResolvePluginContext<T>,
    data: {
      plugin: TPlugin;
      result: unknown;
      object: T;
    },
    index: number,
  ) => void;
}

/**
 * @internal
 */
export interface ResolvePluginContext<
  T,
  TSystemFactoryTypes extends SystemFactoryTypes = SystemFactoryTypes,
> extends WithMeta {
  emitter: Emitter<{
    [INIT_EVENT]: () => void;
    [DESTROY_EVENT]: () => void;
  }>;

  object: T;

  skipSet: (property: string) => boolean;

  refs: WeakMap<
    PluginKey<any, any>,
    {
      plugin: TSystemFactoryTypes["plugin"];
      result: object;
    }
  >;

  getContext: () => Record<string, any>;

  meta: Record<string, unknown>;
}

/**
 * @internal
 */
export interface ResolvedPluginRef {
  plugin: Plugin;
  result: object;
  meta: Record<string, any>;
}

/**
 * @public
 */
export type ResolvePluginHandler<
  TSystemFactoryTypes extends SystemFactoryTypes = SystemFactoryTypes,
> = <T extends {}>(
  composable: TSystemFactoryTypes["composable"],
  o: any,
  options: ResolveOptions<
    T,
    TSystemFactoryTypes["resolveContext"],
    TSystemFactoryTypes["plugin"]
  >,
) => ComposedObject<T>;

/**
 * @public
 *
 * A function that resolves and integrates plugins into a given object
 * based on specified options and a composable context.
 */
export const resolve: ResolvePluginHandler = function resolve<T extends {}>(
  composable: SystemFactoryTypes["composable"],
  o: any,
  options: ResolveOptions<
    T,
    SystemFactoryTypes["resolveContext"],
    SystemFactoryTypes["plugin"]
  >,
) {
  const metadata: MetaStore = {},
    plugins = composable.context.plugins,
    reservedProperties = options.reservedProperties ?? [],
    refs = new WeakMap<PluginKey<any, any>, ResolvedPluginRef>(),
    createContext = options.createContext ?? (() => ({})),
    e = emitter<InternalEvents<T, Plugin>>();

  const context: ResolvePluginContext<T> = {
    object: o as T,
    emitter: e as ResolvePluginContext<T>["emitter"],
    getMeta: getMeta.bind(metadata),
    setMeta: setMeta.bind(metadata),
    skipSet: (property: string): boolean => {
      if (reservedProperties.length > 0) {
        return reservedProperties.includes(property);
      }
      return false;
    },
    refs,
    meta: {},
    getContext: createContext,
  };

  if (options.beforePluginMount)
    e.on(BEFORE_PLUGIN_MOUNT, options.beforePluginMount);
  if (options.afterPluginMount)
    e.on(AFTER_PLUGIN_MOUNT, options.afterPluginMount);

  const dispose = () => context.emitter.emit(DESTROY_EVENT);

  for (let i = 0; i < plugins.length; i++) {
    const plugin = plugins[i];
    e.emit(BEFORE_PLUGIN_MOUNT, context, plugin, i);
    const { object, callResult } = (resolvePlugin<T>).call(context, plugin);
    e.emit(
      AFTER_PLUGIN_MOUNT,
      context,
      {
        plugin,
        result: callResult,
        object,
      },
      i,
    );
  }

  context.emitter.emit(INIT_EVENT);

  return {
    object: context.object,
    dispose,
  };
};

function resolvePlugin<T extends {}>(
  this: ResolvePluginContext<T>,
  plugin: Plugin,
) {
  const meta = plugin[$PLUGIN],
    pluginKey = plugin[$PLUGIN_KEY];

  const context: PluginContext = {
    onMount: (cb) => this.emitter.on(INIT_EVENT, () => cb(), { once: true }),
    onDispose: (cb) =>
      this.emitter.on(DESTROY_EVENT, () => cb(), { once: true }),
    get: (p) => (this.refs.get(p)?.result as any | null) ?? null,
    getMeta: this.getMeta,
    setMeta: this.setMeta,
    ...this.getContext(),
  };

  if (meta.onBeforeMount) {
    meta.onBeforeMount.call(this);
  }

  if (meta.onMount) {
    const fn = meta.onMount;
    context.onMount(fn);
  }

  if (meta.onDispose) {
    const fn = meta.onDispose;
    context.onDispose(fn);
  }

  const r = plugin.call(context, this.object, context);
  const result = { object: this.object, callResult: r };
  if (!r) return result;
  const keys = Object.keys(r);
  // eslint-disable-next-line @typescript-eslint/prefer-for-of
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (this.skipSet(k)) continue;
    const descriptor = Object.getOwnPropertyDescriptor(r, k);
    if (descriptor) {
      Object.defineProperty(this.object, k, descriptor);
    } else {
      Reflect.set(this.object, k, r[k]);
    }
  }
  this.refs.set(pluginKey, { plugin, result: r });
  return result;
}
