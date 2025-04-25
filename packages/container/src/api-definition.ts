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

import type {
  ApiDefinitionCreator,
  ApiDefinitionInternalCreator,
  GenericStoreApi,
  Plugin,
  PluginContext,
} from './types';
import { $CREATOR, $PLUGIN } from './api';

export class ApiDefinition<T extends GenericStoreApi, E extends {}>
  implements ApiDefinitionCreator<T, E>
{
  readonly [$CREATOR]: ApiDefinitionInternalCreator<T, E>;
  #customPluginId: number = 0;
  readonly #id: number = 0;
  readonly #plugins: Array<Plugin<any, any>> = [];

  constructor(name: string, id: number, factory: () => T) {
    this[$CREATOR] = { name, plugins: this.#plugins, factory };
    this.#id = id;
  }

  extend<TExtendedSignal extends {} | void>(
    createPlugin: (ctx: T & E, context: PluginContext<T>) => TExtendedSignal,
  ): ApiDefinitionCreator<T, TExtendedSignal & Omit<E, keyof TExtendedSignal>> {
    if (
      typeof createPlugin === 'function' &&
      !createPlugin.hasOwnProperty($PLUGIN)
    ) {
      this.#plugins.push({
        name: `custom-${++this.#customPluginId}`,
        apply: createPlugin,
      });
    } else {
      this.#plugins.push(createPlugin);
    }

    return this as unknown as ApiDefinitionCreator<
      T,
      TExtendedSignal & Omit<E, keyof TExtendedSignal>
    >;
  }
}
