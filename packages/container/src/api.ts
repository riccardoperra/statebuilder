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
  GenericStoreApi,
  ContainerPluginContext,
  StoreApiDefinition,
} from './types';
import { onCleanup } from 'solid-js';
import { ApiDefinition } from './api-definition';
import { Container } from './container';
import { ResolvedPluginContext } from './resolved-plugin-context';
import { StateBuilderError } from './error';

import {
  $PLUGIN,
  type CreatePluginOptions,
  type Plugin as $Plugin,
} from 'pluggino';

import { createPlugin, resolve as $resolve, type Plugin } from './system';

export const $CREATOR = Symbol('store-creator-api');

export interface CreateOptions {
  key: string;
}

/**
 * A factory function that creates a store API definition creator.
 *
 * @param name - The name of the store API definition.
 * @param creator - The function that creates the store API instance.
 * @returns A store API definition creator that takes arguments to be passed to the store API instance creator and returns a store API definition object.
 */
export function create<P extends any[], T extends GenericStoreApi>(
  name: string,
  creator: (...args: P) => T,
): (...args: P) => ApiDefinitionCreator<T> {
  let id = 0;
  return (...args) => {
    let options = args.at(-1) as Partial<CreateOptions> | undefined;
    let resolvedName = options?.key;
    if (!resolvedName) {
      resolvedName = `${name}-${++id}`;
    }
    return new ApiDefinition<T, {}>(resolvedName, () =>
      creator(...(args as unknown as P)),
    );
  };
}

function checkDependencies(resolvedPlugins: string[], plugin: Plugin) {
  const meta = plugin[$PLUGIN];
  if (!meta || !meta.dependencies) return;
  meta.dependencies.forEach((dependency) => {
    if (!resolvedPlugins.includes(dependency)) {
      throw new StateBuilderError(
        `The dependency '${dependency}' of plugin '${meta.name}' is missing`,
        { cause: { resolvedDependencies: resolvedPlugins, plugin } },
      );
    }
  });
}

/**
 * A function that resolves a store API definition by applying the provided extensions to it.
 *
 * @template TDefinition - The type of the store API definition.
 * @param definition - The store API definition to resolve.
 * @param container - The StateContainer in the plugin context.
 * @returns The resolved store API with all the extensions applied.
 */
export function resolve<
  TDefinition extends StoreApiDefinition<GenericStoreApi, Record<string, any>>,
>(definition: TDefinition, container?: Container) {
  const { factory, composer } = definition[$CREATOR];

  const resolvedPlugins: string[] = [],
    pluginContext = new ResolvedPluginContext(container),
    resolvedStore = factory();

  const composedObject = $resolve(composer, resolvedStore, {
    createContext: () => ({
      inject: pluginContext.inject.bind(pluginContext),
    }),
    beforePluginMount: (context, plugin, index) => {
      checkDependencies(resolvedPlugins, plugin);
    },
    afterPluginMount: (context, data, index) => {
      resolvedPlugins.push(data.plugin[$PLUGIN].name);
    },
  });

  onCleanup(() => {
    composedObject.dispose();
    if (container) {
      container.remove(definition);
    }
  });

  return resolvedStore;
}

export interface PluginCreatorOptions extends CreatePluginOptions {
  dependencies?: string[];
}

/**
 * A function that creates a plugin for a generic store API.
 *
 * @template TStore - The type of the store API that this plugin is for.
 * @template Extension - The type of the extension that this plugin adds to the store.
 * @param pluginCallback - The function that will be called when the plugin is applied.
 * @param options - The options for creating the plugin.
 * @returns A plugin object with the given name and dependencies and the apply function provided.
 */
function _makePlugin<
  TCallback extends <S extends GenericStoreApi>(
    store: S,
    context: ContainerPluginContext<S>,
  ) => unknown,
>(pluginCallback: TCallback, options: PluginCreatorOptions): TCallback {
  return createPlugin(pluginCallback as any, {
    name: options.name,
    dependencies: options.dependencies ?? [],
  });
}

export const makePlugin = Object.assign(_makePlugin, {
  typed<T extends GenericStoreApi>() {
    return function _makePlugin2<
      TCallback extends <S extends T>(store: S) => unknown,
    >(cb: TCallback, options: PluginCreatorOptions): TCallback {
      return _makePlugin(cb as any, options);
    };
  },
});
