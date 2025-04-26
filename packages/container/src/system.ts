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

import type { Composable, SystemFactoryTypes } from 'tsplug';
import { createSystem, type Plugin as $Plugin } from 'tsplug';
import type { PluginCreatorOptions } from './api';
import type { PluginContext } from './resolved-plugin-context';

export type Plugin<
  TCallback extends (o: any, context: any) => any = (
    o: any,
    context: any,
  ) => any,
  T = ReturnType<TCallback>,
> = $Plugin<TCallback, T, PluginCreatorOptions>;

export type StatebuilderSystem = SystemFactoryTypes<
  PluginCreatorOptions,
  Composable<any>,
  PluginContext,
  Plugin
>;

export const { resolve, createPlugin } = createSystem<StatebuilderSystem>();
