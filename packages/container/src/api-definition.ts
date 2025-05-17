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
  ContainerPluginContext,
} from './types';
import { $CREATOR } from './api';
import { Composer } from 'pluggino';

export class ApiDefinition<T extends GenericStoreApi, E extends {}>
  implements ApiDefinitionCreator<T, E>
{
  readonly [$CREATOR]: ApiDefinitionInternalCreator<T, E>;

  composer = new Composer();

  constructor(name: string, factory: () => T) {
    this[$CREATOR] = {
      name,
      factory,
      composer: this.composer,
    };
  }

  extend<TExtendedSignal extends {} | void>(
    createPlugin: (
      ctx: T & E,
      context: ContainerPluginContext<T>,
    ) => TExtendedSignal,
  ): ApiDefinitionCreator<T, TExtendedSignal & Omit<E, keyof TExtendedSignal>> {
    this.composer.with(createPlugin as any);

    return this as unknown as ApiDefinitionCreator<
      T,
      TExtendedSignal & Omit<E, keyof TExtendedSignal>
    >;
  }
}
