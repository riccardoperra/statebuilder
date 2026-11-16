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

import { resolve } from "./resolve.js";
import { createPlugin } from "./create-plugin.js";
import type { ResolvePluginHandler } from "./resolve.js";
import type {
  CreatePluginFactory,
  CreatePluginOptions,
} from "./create-plugin.js";
import type { Composable } from "./composer.js";
import type { Plugin } from "./plugin.js";

/**
 * Defines the types used in the system factory.
 *
 * @public
 */
export interface SystemFactoryTypes<
  TCreatePluginOptions extends CreatePluginOptions = CreatePluginOptions,
  TComposable extends Composable<any> = Composable<any>,
  TResolveContext extends Record<string, any> = Record<string, any>,
  TPlugin extends Plugin = Plugin,
> {
  pluginOptions: TCreatePluginOptions;
  composable: TComposable;
  resolveContext: TResolveContext;
  plugin: TPlugin;
}

/**
 * @public
 */
export interface SystemFactory<T extends SystemFactoryTypes> {
  createPlugin: CreatePluginFactory<T>;
  resolve: ResolvePluginHandler<T>;
}

/**
 * This method configures and initializes factories for creating plugins and resolving components
 * specific to the provided `SystemFactoryTypes` type parameter.
 *
 * @public
 */
export function createSystem<T extends SystemFactoryTypes>(): SystemFactory<T> {
  return {
    createPlugin: createPluginFactory<T>(),
    resolve: resolveFactory<T>(),
  } as unknown as SystemFactory<T>;
}

function createPluginFactory<
  TSystemFactoryTypes extends SystemFactoryTypes,
>(): CreatePluginFactory<TSystemFactoryTypes> {
  return createPlugin;
}

function resolveFactory<
  TSystemFactoryTypes extends SystemFactoryTypes,
>(): ResolvePluginHandler<TSystemFactoryTypes> {
  return resolve as unknown as ResolvePluginHandler<TSystemFactoryTypes>;
}
