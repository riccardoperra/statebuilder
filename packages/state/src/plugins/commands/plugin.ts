import { GenericStoreApi, GetStoreApiSetter, GetStoreApiState } from '~/types';
import {
  ExecuteCommandCallback,
  makeCommandNotifier,
} from '~/plugins/commands/notifier';
import { GenericStateCommand } from '~/plugins/commands/command';
import { makePlugin } from '~/api';
import {
  ProxifyCommands,
  StoreWithProxyCommands,
} from '~/plugins/commands/types';
import { makeProxyHandlers } from '~/plugins/commands/proxy';
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
        context.hooks.onInit(() => {
          const unsubscribe = applyDevtools(store, storeWithProxy, {
            storeName,
          });
          context.hooks.onDestroy(() => unsubscribe());
        });
      }

      return storeWithProxy;
    },
    {
      name: 'withProxyCommands',
    },
  );
}
