import { batch, ObservableObserver, untrack } from 'solid-js';
import { GenericStoreApi } from '~/types';
import { createTrackObserver } from './track';
import {
  CommandPayload,
  createCommand,
  ExecutedGenericStateCommand,
  GenericStateCommand,
  StateCommand,
} from './command';
import { createEventBus } from '@solid-primitives/event-bus';
import { Observable } from './types';

export type ExecuteCommandCallback<
  T,
  Command extends GenericStateCommand,
  TSetter = any,
> = (
  payload: CommandPayload<Command>,
  meta: {
    set: TSetter;
    state: T;
  },
) => T | void;

export const [track, untrackCommand] = createTrackObserver();

export function makeCommandNotifier<T>(ctx: GenericStoreApi<T>) {
  const initCommand = createCommand('@@INIT');
  const bus = createEventBus<ExecutedGenericStateCommand>();
  bus.emit(initCommand.execute(void 0));

  const callbacks = new Map<
    string,
    ReadonlyArray<ExecuteCommandCallback<T, GenericStateCommand>>
  >();

  bus.listen((command) => {
    const resolvedCallbacks = callbacks.get(command.identity) ?? [];
    batch(() => {
      untrack(() => {
        for (const callback of resolvedCallbacks) {
          const result = callback(command.consumerValue, {
            set: ctx.set,
            state: ctx(),
          });

          if (result !== undefined) {
            ctx.set(() => result);
          }
        }
      });
    });
  });

  function retrieveCommand(
    commandOrRegexp: readonly GenericStateCommand[] | RegExp | undefined,
    command: ExecutedGenericStateCommand | undefined | null,
  ) {
    let resolvedCommand: ExecutedGenericStateCommand | null = null;
    if (!command || command.silent) return null;

    if (commandOrRegexp === undefined) {
      resolvedCommand = command;
    } else if (commandOrRegexp instanceof RegExp) {
      if (commandOrRegexp.test(command.identity)) {
        resolvedCommand = command;
      }
    } else {
      const foundCommand = !!(commandOrRegexp ?? []).find(
        (watchedCommand) => watchedCommand.identity === command.identity,
      );
      if (foundCommand) resolvedCommand = command;
    }

    return resolvedCommand;
  }

  return {
    executeCommand<T extends ExecutedGenericStateCommand>(command: T) {
      bus.emit(command);
    },
    callbacks,
    track,
    untrackCommand,
    watchCommand<Commands extends GenericStateCommand>(
      commands?: readonly Commands[] | RegExp,
    ): Observable<Commands> {
      return {
        [Symbol.observable || '@@observable']() {
          return this;
        },
        subscribe(observer: ObservableObserver<Commands>): {
          unsubscribe(): void;
        } {
          const handler =
            typeof observer === 'function'
              ? observer
              : observer.next && observer.next.bind(observer);

          if (!handler) {
            return {
              unsubscribe() {},
            };
          }

          const clear = bus.listen((command) => {
            const resolvedCommand = retrieveCommand(commands, command);
            if (resolvedCommand) {
              handler(resolvedCommand as unknown as Commands);
            }
          });

          return {
            unsubscribe() {
              clear();
            },
          };
        },
      };
    },
    dispatch<Command extends GenericStateCommand>(
      command: Command,
      payload: CommandPayload<Command>,
    ): void {
      const resolvedCommand = command
        .with(track() ? {} : { silent: true })
        .execute(payload);

      bus.emit(resolvedCommand);

      bus.emit(
        createCommand(`@@AFTER/${command.identity}`)
          .with({
            identity: `@@AFTER/${command.identity}`,
            correlate: resolvedCommand,
            internal: true,
          })
          .execute(void 0),
      );
    },
  };
}

export function isInternalCommand<T extends StateCommand<any, any>>(
  command: T,
): command is T & {
  internal: true;
} {
  return !!Reflect.get(command, 'internal');
}

export function isAfterCommand<T extends StateCommand<any, any>>(
  command: T,
): command is T & {
  correlate: ExecutedGenericStateCommand;
  internal: true;
} {
  return isInternalCommand(command) && command.identity.startsWith('@@AFTER');
}
