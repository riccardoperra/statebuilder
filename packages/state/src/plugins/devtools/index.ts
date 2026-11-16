import { untrack } from 'solid-js';
import { createPlugin } from '@statebuilder/container';

export interface WithDevtoolsOptions {
  /** The instance name shown in Redux DevTools. */
  name: string;
}

export interface DevtoolsMessage {
  type: string;
  payload: { type: string };
  state: string;
}

export interface DevtoolsConnection {
  init(state: unknown): void;
  send(action: { type: string; payload?: unknown }, state: unknown): void;
  subscribe(listener: (message: DevtoolsMessage) => void): () => void;
  unsubscribe(): void;
}

export interface ReduxDevtoolsExtension {
  connect(options: { name: string }): DevtoolsConnection;
}

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__?: ReduxDevtoolsExtension;
  }
}

const TIME_TRAVEL = new Set(['JUMP_TO_STATE', 'JUMP_TO_ACTION', 'ROLLBACK']);

/**
 * Connects the store to Redux DevTools. Each write is sent with the name and
 * args of the action that did it, or as `set`. Does nothing when the
 * extension is not installed.
 */
export function withDevtools(options: WithDevtoolsOptions) {
  return createPlugin(
    (store, context) => {
      const extension = globalThis.window?.__REDUX_DEVTOOLS_EXTENSION__;
      if (!extension) return;

      const devtools = extension.connect({ name: options.name });
      devtools.init(untrack(store));

      let travelling = false;
      const offSet = context.onSet((value, meta) => {
        if (travelling) return;
        devtools.send(
          {
            type: meta.action ? meta.action.name : 'set',
            payload: meta.action?.args,
          },
          value,
        );
      });

      const offMessage = devtools.subscribe((message) => {
        if (message.type !== 'DISPATCH') return;
        if (!TIME_TRAVEL.has(message.payload.type)) return;
        const state = JSON.parse(message.state);
        travelling = true;
        try {
          store.set(() => state);
        } finally {
          travelling = false;
        }
      });

      context.onDispose(() => {
        offSet();
        offMessage();
      });
    },
    { name: 'withDevtools' },
  );
}
