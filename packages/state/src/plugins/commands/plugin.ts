import {
  GenericStoreApi,
  GetStoreApiSetter,
  GetStoreApiState,
} from '@statebuilder/container';
import { ExecuteCommandCallback, makeCommandNotifier } from './notifier';
import { GenericStateCommand } from './command';
import { makePlugin } from '@statebuilder/container';
import type { ProxifyCommands, StoreWithProxyCommands } from './types';
import { makeProxyHandlers } from './proxy';
import { applyDevtools } from '~/plugins/commands/devtools';

function plugin<ActionsMap extends Record<string, unknown>>(): <
  TGenericApi extends GenericStoreApi,
>(
  ctx: TGenericApi,
) => StoreWithProxyCommands<
  TGenericApi,
  GetStoreApiState<TGenericApi>,
  ProxifyCommands<ActionsMap>
> {
  return <TGenericApi extends GenericStoreApi>(
    ctx: TGenericApi,
  ): StoreWithProxyCommands<
    TGenericApi,
    GetStoreApiState<TGenericApi>,
    ProxifyCommands<ActionsMap>
  > => {
    const { callbacks, watchCommand, dispatch } = makeCommandNotifier(ctx);
    const { commands, actions } = makeProxyHandlers<ActionsMap>(dispatch);

    return {
      commands,
      actions,
      hold(command, cb) {
        const resolvedCallbacks = callbacks.get(command.identity) || [];
        const updatedCallbacks = resolvedCallbacks.concat(
          cb as ExecuteCommandCallback<
            GetStoreApiState<TGenericApi>,
            GenericStateCommand,
            GetStoreApiSetter<TGenericApi>
          >,
        );
        callbacks.set(command.identity, updatedCallbacks);
        return this;
      },
      dispatch,
      watchCommand,
    };
  };
}

interface PluginOptions {
  devtools?: { storeName: string };
}

export function withProxyCommands<T extends Record<string, unknown>>(
  options?: PluginOptions,
) {
  return makePlugin(
    (store, context) => {
      const storeWithProxy = plugin<T>()(store);

      if (options?.devtools) {
        const { storeName } = options.devtools;
        context.onMount(() => {
          const unsubscribe = applyDevtools(store, storeWithProxy, {
            storeName,
          });
          context.onDispose(() => unsubscribe());
        });
      }

      return storeWithProxy;
    },
    {
      name: 'withProxyCommands',
    },
  );
}
