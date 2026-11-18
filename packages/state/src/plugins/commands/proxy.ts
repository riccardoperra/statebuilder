import {
  createCommand,
  type GenericStateCommand,
  type MapCommandToActions,
} from './command';
import type { ProxifyCommands } from './types';

interface ProxyHandlers<ActionsMap extends Record<string, unknown>> {
  readonly commands: ProxifyCommands<ActionsMap>;
  readonly actions: MapCommandToActions<ProxifyCommands<ActionsMap>>;
  /** Whether a command of that name was read from `commands` or `actions`. */
  has(identity: string): boolean;
}

/**
 * The commands exist only as a type, so both maps are proxies that create the
 * command and its action the first time a name is read.
 */
export function makeProxyHandlers<ActionsMap extends Record<string, unknown>>(
  onDispatch: (command: GenericStateCommand, payload: unknown) => void,
): ProxyHandlers<ActionsMap> {
  const commandsMap: Record<string, GenericStateCommand> = {};
  const actionsMap: Record<string, (payload: unknown) => void> = {};

  function ensure(name: string) {
    if (commandsMap[name]) return;
    const command = createCommand(name);
    commandsMap[name] = command;
    actionsMap[name] = (payload) => onDispatch(command, payload);
  }

  function handler(source: Record<string, unknown>): ProxyHandler<object> {
    return {
      ownKeys: () => Reflect.ownKeys(commandsMap),
      getOwnPropertyDescriptor(_, key) {
        if (typeof key !== 'string') return undefined;
        ensure(key);
        return { value: source[key], enumerable: true, configurable: true };
      },
      get(_, key) {
        if (typeof key !== 'string') return undefined;
        ensure(key);
        return source[key];
      },
    };
  }

  return {
    commands: new Proxy(
      {},
      handler(commandsMap),
    ) as ProxifyCommands<ActionsMap>,
    actions: new Proxy({}, handler(actionsMap)) as MapCommandToActions<
      ProxifyCommands<ActionsMap>
    >,
    has: (identity) => identity in commandsMap,
  };
}
