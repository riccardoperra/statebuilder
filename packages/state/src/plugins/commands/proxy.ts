import { Observable } from 'rxjs';
import { GenericStoreApi, GetStoreApiState } from '~/types';
import {
  CommandPayload,
  createCommand,
  GenericStateCommand,
  MapCommandToActions,
  StateCommand,
} from './command';
import { ExecuteCommandCallback, makeCommandNotifier } from './notifier';
import { makePlugin } from '~/api';

type GenericCommandsMap = Record<PropertyKey, GenericStateCommand>;

interface StoreWithProxyCommands<
  TStoreApi extends GenericStoreApi,
  T,
  Commands extends Record<
    PropertyKey,
    GenericStateCommand
  > = GenericCommandsMap,
> {
  hold<Command extends GenericStateCommand>(
    command: Command,
    callback: ExecuteCommandCallback<
      T,
      Command,
      TStoreApi extends GenericStoreApi<any, infer R> ? R : never
    >,
  ): this;

  dispatch<Command extends GenericStateCommand>(
    command: Command,
    payload: CommandPayload<Command>,
  ): void;

  readonly commands: Commands;

  readonly actions: MapCommandToActions<Commands>;

  watchCommand<Commands extends GenericStateCommand[]>(
    commands?: Commands,
  ): Observable<Commands[number]>;
}

type ProxifyCommands<T extends Record<string, unknown>> = {
  [K in keyof T]: StateCommand<K & string, T[K]>;
};

declare function plugin2<
  TGenericStore extends GenericStoreApi,
  ActionsMap extends Record<string, unknown>,
>(): (
  ctx: TGenericStore,
) => StoreWithProxyCommands<
  TGenericStore,
  TGenericStore extends any ? GetStoreApiState<TGenericStore> : never,
  ProxifyCommands<ActionsMap>
>;

function plugin<ActionsMap extends Record<string, unknown>>(): <
  TGenericApi extends GenericStoreApi,
>(
  ctx: TGenericApi,
) => StoreWithProxyCommands<
  TGenericApi,
  TGenericApi extends any ? GetStoreApiState<TGenericApi> : never,
  ProxifyCommands<ActionsMap>
> {
  type ProxifiedCommands = ProxifyCommands<ActionsMap>;

  return <T>(ctx: GenericStoreApi<T, any>) => {
    const { commandsSubject$, callbacks, track, watchCommand } =
      makeCommandNotifier(ctx);

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
            actions[property] = (payload) => {
              dispatch(command, payload);
            };
          }
          return actions[property];
        },
      };
    }

    function dispatch(
      command: GenericStateCommand,
      payload: CommandPayload<GenericStateCommand>,
    ) {
      const resolvedCommand = !track()
        ? command.with({ silent: true as const })
        : command;
      commandsSubject$.next(resolvedCommand.execute(payload));
    }

    const commands = new Proxy({} as ProxifiedCommands, commandsProxyHandler());

    const actions = new Proxy(
      {} as MapCommandToActions<ProxifiedCommands>,
      actionsProxyHandler(),
    );

    return {
      commands,
      actions,
      hold(command, cb) {
        const resolvedCallbacks = callbacks.get(command.identity) || [];
        const updatedCallbacks = resolvedCallbacks.concat(
          cb as unknown as ExecuteCommandCallback<T, GenericStateCommand>,
        );
        callbacks.set(command.identity, updatedCallbacks);
        return this;
      },
      dispatch,
      watchCommand,
    };
  };
}

export function _withProxyCommands<T extends Record<string, unknown>>() {
  return makePlugin((store) => plugin<T>()(store), {
    name: 'withProxyCommand',
  });
}

export const withProxyCommands = Object.assign(_withProxyCommands, {
  of<S extends GenericStoreApi>(store: S) {
    return {
      with<T extends Record<string, unknown>>() {
        return makePlugin(() => plugin<T>()(store), {
          name: 'withProxyCommands',
        });
      },
    };
  },
});
