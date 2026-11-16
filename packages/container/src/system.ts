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

import type { Composable, SystemFactoryTypes } from './pluggino';
import { $PLUGIN, createSystem, type Plugin as $Plugin } from './pluggino';
import type { PluginCreatorOptions } from './api';
import type { Container } from './container';
import type {
  ContainerPluginContext,
  GenericStoreApi,
  StoreApiDefinition,
} from './types';
import type { StoreWrites } from './writes';
import { StateBuilderError } from './error';
import { $CREATOR } from './symbols';

export type Plugin<
  TCallback extends (o: any, context: any) => any = (
    o: any,
    context: any,
  ) => any,
  T = ReturnType<TCallback>,
> = $Plugin<TCallback, T, PluginCreatorOptions>;

export interface ResolveArgs {
  container: Container | undefined;
  definition: StoreApiDefinition<any, any>;
  writes: StoreWrites;
}

export type StatebuilderSystem = SystemFactoryTypes<
  PluginCreatorOptions,
  Composable<any>,
  Pick<ContainerPluginContext<any>, 'inject' | 'onSet' | 'runInAction'>,
  Plugin,
  ResolveArgs
>;

export const { resolve, createPlugin } = createSystem<StatebuilderSystem>({
  createContext: ({ container, writes }) => ({
    inject: (definition) => {
      if (!container) {
        throw new StateBuilderError('No container set in current context.');
      }
      return container.get(definition);
    },
    onSet: writes.onSet,
    runInAction: writes.runInAction,
  }),
  afterPluginMount: (_, { result, object }, __, { writes }) => {
    if (
      typeof (result as Partial<GenericStoreApi> | undefined)?.set !==
      'function'
    ) {
      return;
    }
    const store = object as GenericStoreApi;
    store.set = writes.wrap(store.set);
  },
  beforePluginMount: (_, plugin, index, { definition }) => {
    const dependencies = plugin[$PLUGIN].dependencies;
    if (!dependencies) return;
    const mounted = definition[$CREATOR].composer.context.plugins
      .slice(0, index)
      .map((mountedPlugin) => mountedPlugin[$PLUGIN].name);
    for (const dependency of dependencies) {
      if (!mounted.includes(dependency)) {
        throw new StateBuilderError(
          `The dependency '${dependency}' of plugin '${plugin[$PLUGIN].name}' is missing`,
          { cause: { resolvedDependencies: mounted, plugin } },
        );
      }
    }
  },
});
