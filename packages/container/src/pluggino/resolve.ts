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

import { $PLUGIN } from './plugin.js';
import { emitter } from './emitter.js';
import { $PLUGIN_KEY } from './plugin-key.js';
import { getMeta, setMeta } from './meta.js';
import type { Plugin, PluginContext } from './plugin.js';
import type { Emitter } from './emitter.js';
import type { PluginKey } from './plugin-key.js';
import type { MetaStore, WithMeta } from './meta.js';
import type { SystemFactoryTypes } from './system.js';

/**
 * The configuration of a system, applied on every `resolve` call.
 * `args` is the per-call argument given to `resolve`.
 *
 * @public
 */
export interface SystemConfig<T extends SystemFactoryTypes> {
  reservedProperties?: ReadonlyArray<string>;
  createContext?: (args: T['resolveArgs']) => T['resolveContext'];
  beforePluginMount?: (
    context: ResolvePluginContext<any, T>,
    plugin: T['plugin'],
    index: number,
    args: T['resolveArgs'],
  ) => void;
  afterPluginMount?: (
    context: ResolvePluginContext<any, T>,
    data: { plugin: T['plugin']; result: unknown; object: unknown },
    index: number,
    args: T['resolveArgs'],
  ) => void;
}

const DESTROY_EVENT: unique symbol = Symbol('plugin.destroy');
const INIT_EVENT: unique symbol = Symbol('plugin.init');

export interface ComposedObject<T> {
  object: T;
  dispose: () => void;
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
      plugin: TSystemFactoryTypes['plugin'];
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
  composable: TSystemFactoryTypes['composable'],
  o: any,
  args: TSystemFactoryTypes['resolveArgs'],
) => ComposedObject<T>;

/**
 * @internal
 *
 * Resolves and integrates the plugins of a composable into a given object.
 */
export function resolve<T extends {}, TSystem extends SystemFactoryTypes>(
  config: SystemConfig<TSystem>,
  composable: TSystem['composable'],
  o: any,
  args: TSystem['resolveArgs'],
): ComposedObject<T> {
  const metadata: MetaStore = {},
    plugins = composable.context.plugins,
    reservedProperties = config.reservedProperties ?? [],
    refs = new WeakMap<PluginKey<any, any>, ResolvedPluginRef>(),
    e = emitter();

  const context: ResolvePluginContext<T, TSystem> = {
    object: o as T,
    emitter: e as ResolvePluginContext<T>['emitter'],
    getMeta: getMeta.bind(metadata),
    setMeta: setMeta.bind(metadata),
    skipSet: (property: string): boolean =>
      reservedProperties.includes(property),
    refs,
    meta: {},
    getContext: () => config.createContext?.(args) ?? {},
  };

  const dispose = () => context.emitter.emit(DESTROY_EVENT);

  for (let i = 0; i < plugins.length; i++) {
    const plugin = plugins[i];
    config.beforePluginMount?.(context, plugin, i, args);
    const { object, callResult } = (resolvePlugin<T>).call(context, plugin);
    config.afterPluginMount?.(
      context,
      { plugin, result: callResult, object },
      i,
      args,
    );
  }

  context.emitter.emit(INIT_EVENT);

  return {
    object: context.object,
    dispose,
  };
}

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
