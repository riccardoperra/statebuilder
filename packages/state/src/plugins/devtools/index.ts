import { makePlugin } from '~/api';
import { untrack } from 'solid-js';
import { GenericStoreApi } from '~/types';

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

export function withReduxDevtools(options: WithReduxDevtoolsOptions) {
  return makePlugin(
    <S extends GenericStoreApi>(storeApi: S) => {
      if (!globalThis.window) {
        return;
      }
      const { __REDUX_DEVTOOLS_EXTENSION__ } = window;

      if (!__REDUX_DEVTOOLS_EXTENSION__) return;

      const devTools = __REDUX_DEVTOOLS_EXTENSION__.connect({
        name: options.storeName,
      });
      console.log(devTools);

      const originalSet = storeApi.set;

      // TODO: add state initializer with hook
      devTools.init(untrack(storeApi));

      const set: typeof storeApi.set = (...args: any[]) => {
        originalSet(...args);
        devTools.send(
          {
            type: 'Update',
            payload: args,
          },
          untrack(storeApi),
        );
      };

      devTools.subscribe((message) => {
        console.log('message', message);
        if (message.type === 'DISPATCH') {
          const payloadType = message.payload.type;
          // TODO: handle commit type?

          if (
            payloadType === 'JUMP_TO_STATE' ||
            payloadType === 'JUMP_TO_ACTION' ||
            payloadType === 'ROLLBACK'
          ) {
            const state = JSON.parse(message.state);
            originalSet(() => state);
          }
        }
      });

      // TODO: add helper to override setter or fix types
      const result = {
        set,
      } as const;

      return result as {};
    },
    { name: 'reduxDevtools' },
  );
}
