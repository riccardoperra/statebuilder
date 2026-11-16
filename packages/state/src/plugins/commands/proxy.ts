import {
  createCommand,
  GenericStateCommand,
  MapCommandToActions,
  StateCommand,
} from '~/plugins/commands/command';
import { GenericCommandsMap, ProxifyCommands } from '~/plugins/commands/types';

interface ProxyHandlers<ActionsMap extends Record<string, unknown>> {
  readonly commands: ProxifyCommands<ActionsMap>;
  readonly actions: MapCommandToActions<{
    [key in keyof ActionsMap]: StateCommand<any, ActionsMap[key]>;
  }>;
}

export function makeProxyHandlers<ActionsMap extends Record<string, unknown>>(
  onDispatch: (command: GenericStateCommand, payload: unknown) => void,
): ProxyHandlers<ActionsMap> {
  type ProxifiedCommands = ProxifyCommands<ActionsMap>;

  function commandsProxyHandler(): ProxyHandler<ProxifiedCommands> {
    const commandsMap: Record<string, GenericStateCommand> = {};
    return {
      ownKeys() {
        return Reflect.ownKeys(commandsMap);
      },
      getOwnPropertyDescriptor(target, key) {
        return {
          value: Reflect.get(commands, key),
          enumerable: true,
          configurable: true,
        };
      },
      get(_, property: string) {
        if (!commandsMap[property]) {
          commandsMap[property] = createCommand(property).withPayload();
          void Reflect.get(actions, property);
        }
        return commandsMap[property];
      },
    };
  }

  function actionsProxyHandler(): ProxyHandler<
    MapCommandToActions<ProxifiedCommands>
  > {
    const actions: MapCommandToActions<GenericCommandsMap> = {};

    return {
      ownKeys() {
        return Reflect.ownKeys(actions);
      },
      getOwnPropertyDescriptor(target, key) {
        return {
          value: Reflect.get(actions, key),
          enumerable: true,
          configurable: true,
        };
      },
      get(_, property: string) {
        const command = commands[
          property as keyof typeof commands
        ] as unknown as GenericStateCommand;
        if (!actions[property]) {
          actions[property] = (payload) => onDispatch(command, payload);
        }
        return actions[property];
      },
    };
  }

  const commands = new Proxy({} as ProxifiedCommands, commandsProxyHandler());

  const actions = new Proxy(
    {} as MapCommandToActions<ProxifiedCommands>,
    actionsProxyHandler(),
  );

  return { commands, actions } as const;
}
