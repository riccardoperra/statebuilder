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

export { Container } from './container';

export type { Plugin, StatebuilderSystem } from './system';
export { create, makePlugin, resolve, $CREATOR } from './api';

export { ApiDefinition } from './api-definition';

export { $SB_DEV, __devRegisterContainer } from './dev';

export { runInSubRoot } from './root';

export { StateBuilderError } from './error';

export type {
  GenericStoreApi,
  ExtractStore,
  StoreApiDefinition,
  ApiDefinitionCreator,
  GetStoreApiSetter,
  GetStoreApiState,
} from './types';
