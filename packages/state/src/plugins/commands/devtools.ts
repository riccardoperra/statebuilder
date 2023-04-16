import { untrack } from 'solid-js';
import { GenericStoreApi } from '~/types';
import { StoreWithProxyCommands } from '~/plugins/commands/types';
import { isAfterCommand } from '~/plugins/commands/notifier';

interface WithReduxDevtoolsOptions {
  storeName: string;
}

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__: {
      connect(options: any): {
        send(
          data: { type: string } & Record<string, any>,
          state: Record<string, any>,
        ): void;
        init(state: Record<string, any>): void;
        unsubscribe(): void;
        subscribe(
          cb: (message: {
            type: string;
            payload: { type: string };
            state: string;
          }) => void,
        ): () => void;
      };
    };
  }
}

export function applyDevtools(
  storeApi: GenericStoreApi,
  plugin: StoreWithProxyCommands<any, any>,
  options: WithReduxDevtoolsOptions,
): () => void {
  if (!globalThis.window) {
    return () => void 0;
  }
  const { __REDUX_DEVTOOLS_EXTENSION__ } = window;

  if (!__REDUX_DEVTOOLS_EXTENSION__) return () => void 0;

  const devTools = __REDUX_DEVTOOLS_EXTENSION__.connect({
    name: options.storeName,
  });

  const commandsSubscription = plugin
    .watchCommand(/@@AFTER.*/)
    .subscribe((command) => {
      if (!command) return;

      if (isAfterCommand(command)) {
        devTools.send(
          {
            type: 'Execute: ' + command.correlate.identity,
            payload: command.correlate.consumerValue,
          },
          storeApi(),
        );
      }
    });

  devTools.init(untrack(storeApi));

  const unsubscribeDevtools = devTools.subscribe((message) => {
    if (message.type === 'DISPATCH') {
      const payloadType = message.payload.type;
      if (
        payloadType === 'JUMP_TO_STATE' ||
        payloadType === 'JUMP_TO_ACTION' ||
        payloadType === 'ROLLBACK'
      ) {
        const state = JSON.parse(message.state);
        storeApi.set(() => state);
      }
    }
  });

  return () => {
    unsubscribeDevtools();
    commandsSubscription.unsubscribe();
  };
}
