import {
  Accessor,
  batch,
  createEffect,
  createSignal,
  on,
  untrack,
} from 'solid-js';
import { GenericStoreApi } from '~/types';
import { createTrackObserver } from './track';
import {
  CommandPayload,
  ExecutedGenericStateCommand,
  GenericStateCommand,
  StateCommand,
} from './command';

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
  const [latestCommand, executeCommand] = createSignal<
    ExecutedGenericStateCommand | undefined
  >(undefined, { equals: false });

  const callbacks = new Map<
    string,
    ReadonlyArray<ExecuteCommandCallback<T, GenericStateCommand>>
  >();

  createEffect(
    on(latestCommand, (command) => {
      if (!command) return;

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
    }),
  );

  return {
    executeCommand,
    callbacks,
    track,
    untrackCommand,
    watchCommand<Commands extends GenericStateCommand>(
      commands?: readonly Commands[] | RegExp,
    ): Accessor<Commands> {
      const [watchedCommand, watchCommand] = createSignal<
        GenericStateCommand | undefined
      >(undefined, {
        equals: false,
      });

      const filterByRegexp = commands instanceof RegExp;

      createEffect(
        on(latestCommand, (command) => {
          if (!command) return;
          if (filterByRegexp) {
            if (!commands.test(command.identity)) {
              return;
            }
          } else {
            const resolvedCommand = commands
              ? (commands ?? []).find(
                  (watchedCommand) =>
                    watchedCommand.identity === command.identity,
                )
              : command;

            if (!resolvedCommand || resolvedCommand.silent) {
              return;
            }
          }

          watchCommand(() => command as unknown as GenericStateCommand);
        }),
      );
      return watchedCommand as Accessor<Commands>;
    },
    dispatch<Command extends GenericStateCommand>(
      command: Command,
      payload: CommandPayload<Command>,
    ): void {
      const resolvedCommand = !track()
        ? command.with({ silent: true as const })
        : command;

      executeCommand(() => resolvedCommand.execute(payload));

      executeCommand(() =>
        command
          .with({
            identity: `@@AFTER/${command.identity}`,
            correlate: resolvedCommand,
            internal: true,
          })
          .execute({}),
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
