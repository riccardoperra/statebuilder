import {
  createPlugin,
  type ContainerPluginContext,
  type GenericStoreApi,
  type GetStoreApiState,
} from '@statebuilder/container';
import { connectDevtools } from '~/plugins/devtools';
import type { GenericStateCommand } from './command';
import { makeCommandNotifier } from './notifier';
import { makeProxyHandlers } from './proxy';
import type {
  ExecuteCommandCallback,
  ProxifyCommands,
  StoreWithProxyCommands,
} from './types';

interface PluginOptions {
  /** Connects the store to Redux DevTools under this name. */
  devtools?: { storeName: string };
}

export function withProxyCommands<T extends Record<string, unknown>>(
  options?: PluginOptions,
) {
  return createPlugin(
    <TStoreApi extends GenericStoreApi>(
      store: TStoreApi,
      context: ContainerPluginContext<TStoreApi>,
    ): StoreWithProxyCommands<
      TStoreApi,
      GetStoreApiState<TStoreApi>,
      ProxifyCommands<T>
    > => {
      type State = GetStoreApiState<TStoreApi>;
      type Callback = ExecuteCommandCallback<State, GenericStateCommand>;

      const notifier = makeCommandNotifier<State>(
        store,
        context.runInAction,
        (identity): boolean => proxy.has(identity),
      );
      const proxy = makeProxyHandlers<T>(notifier.dispatch);

      if (options?.devtools) {
        connectDevtools(store, context, options.devtools.storeName);
      }

      return {
        commands: proxy.commands,
        actions: proxy.actions,
        hold(
          commandOrHandlers: GenericStateCommand | Record<string, Callback>,
          callback?: Callback,
        ) {
          if (callback) {
            notifier.hold(
              (commandOrHandlers as GenericStateCommand).identity,
              callback,
            );
          } else {
            const handlers = commandOrHandlers as Record<string, Callback>;
            for (const name of Object.keys(handlers)) {
              void proxy.commands[name];
              notifier.hold(name, handlers[name]);
            }
          }
          return this;
        },
        dispatch: notifier.dispatch,
        watchCommand: notifier.watchCommand,
      } as StoreWithProxyCommands<TStoreApi, State, ProxifyCommands<T>>;
    },
    {
      name: 'withProxyCommands',
    },
  );
}
