import {
  Accessor,
  batch,
  createEffect,
  createSignal,
  on,
  untrack,
} from 'solid-js';
import { reconcile } from 'solid-js/store';
import { GenericStoreApi } from '~/types';
import { createTrackObserver } from './track';
import {
  CommandPayload,
  ExecutedGenericStateCommand,
  GenericStateCommand,
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
  const [command, executeCommand] = createSignal<
    ExecutedGenericStateCommand | undefined
  >(undefined, { equals: false });

  const callbacks = new Map<
    string,
    ReadonlyArray<ExecuteCommandCallback<T, GenericStateCommand>>
  >();

  createEffect(
    on(command, (command) => {
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
              ctx.set(reconcile(result));
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
      commands?: readonly Commands[],
    ): Accessor<Commands> {
      const [watchedCommand, watchCommand] = createSignal<
        GenericStateCommand | undefined
      >(undefined, {
        equals: false,
      });
      createEffect(
        on(command, (command) => {
          if (!command) return;

          const resolvedCommand = commands
            ? (commands ?? []).find(
                (watchedCommand) =>
                  watchedCommand.identity === command.identity,
              )
            : command;

          if (!resolvedCommand || resolvedCommand.silent) {
            return;
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
    },
  };
}
