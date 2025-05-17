import { mergeProps, untrack } from 'solid-js';
import { GenericStoreApi } from '@statebuilder/container';
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

let globalState: Record<string, unknown> = {};
let globalStoreName = 'statebuilder/commands';
let devTools: ReturnType<
  (typeof window)['__REDUX_DEVTOOLS_EXTENSION__']['connect']
>;

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

  if (!devTools) {
    devTools = __REDUX_DEVTOOLS_EXTENSION__.connect({
      name: globalStoreName,
    });
  }
  const { storeName } = options;

  globalState = untrack(() =>
    mergeProps(globalState, { [storeName]: storeApi() }),
  );

  const commandsSubscription = plugin
    .watchCommand(/@@AFTER.*/)
    .subscribe((command) => {
      if (!command) return;

      if (isAfterCommand(command)) {
        globalState = mergeProps(globalState, { [storeName]: storeApi() });
        devTools.send(
          {
            type: `[${storeName}] Execute: ` + command.correlate.identity,
            payload: command.correlate.consumerValue,
          },
          globalState,
        );
      }
    });

  devTools.init(globalState);

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
