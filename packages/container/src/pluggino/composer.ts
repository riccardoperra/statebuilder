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

import { isPlugin } from './plugin.js';
import { createPlugin } from './create-plugin.js';
import type { $PLUGIN, Plugin, PluginContext } from './plugin.js';

export class Composer<TObject extends {}> implements Composable<TObject> {
  readonly context: ComposerContext;

  constructor(plugins: ReadonlyArray<Plugin> = []) {
    this.context = { plugins };
  }

  with<T extends {} | void>(
    composerFn: (
      o: TObject,
      context: PluginContext,
    ) => Exclude<T, typeof $PLUGIN> | void,
  ): Composer<void extends T ? TObject : TObject & T> {
    return new Composer([...this.context.plugins, composePlugin(composerFn)]);
  }
}

export interface Composable<TObject extends {}> {
  context: ComposerContext;

  with: <T extends {} | void>(
    composerFn: (
      o: TObject,
      context: PluginContext,
    ) => Exclude<T, typeof $PLUGIN> | void,
  ) => Composable<void extends T ? TObject : TObject & T>;
}

export function composePlugin(
  composerFn: ((o: any, context: PluginContext) => any) | Plugin,
): Plugin {
  if (isPlugin(composerFn)) {
    return composerFn;
  }

  const name =
    composerFn.name || `plugin-${Math.random().toString(16).slice(2)}`;

  return createPlugin(composerFn, { name });
}

export interface ComposerContext {
  readonly plugins: ReadonlyArray<Plugin>;
}
