import { filter, map, Observable, Subject } from 'rxjs';
import { batch, untrack } from 'solid-js';
import { reconcile } from 'solid-js/store';
import { GenericStoreApi } from '~/types';
import { createTrackObserver } from './track';
import {
  CommandPayload,
  createCommand,
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
  const commandsSubject$ = new Subject<ExecutedGenericStateCommand>();

  const callbacks = new Map<
    string,
    ReadonlyArray<ExecuteCommandCallback<T, GenericStateCommand>>
  >();

  commandsSubject$
    .pipe(
      map((command) => {
        const resolvedCallbacks = callbacks.get(command.identity) ?? [];
        return [command, resolvedCallbacks] as const;
      }),
      filter(([command]) => !command.identity.endsWith('@Done')),
    )
    .subscribe(([command, callbacks]) => {
      batch(() => {
        untrack(() => {
          for (const callback of callbacks) {
            const result = callback(command.consumerValue, {
              set: ctx.set,
              state: ctx(),
            });
            if (result !== undefined) {
              ctx.set(reconcile(result));
            }
          }
        });

        const doneCommand = createCommand(
          `${command.identity}@Done`,
        ).withPayload<{
          source: GenericStateCommand;
          payload: unknown;
          state: T;
        }>();

        commandsSubject$.next(
          Object.assign(doneCommand, {
            consumerValue: {
              source: command,
              payload: command.consumerValue,
              state: ctx(),
            },
          }),
        );
      });
    });

  return {
    commandsSubject$,
    callbacks,
    track,
    untrackCommand,
    watchCommand<Commands extends GenericStateCommand>(commands?: Commands[]) {
      return (commandsSubject$ as Observable<Commands>).pipe(
        filter((command) => {
          return !!(commands ?? []).find(
            (x) => x.identity === command.identity && !(x as any).silent,
          );
        }),
      );
    },
    dispatch<Command extends GenericStateCommand>(
      command: Command,
      payload: CommandPayload<Command>,
    ): void {
      const resolvedCommand = !track()
        ? command.with({ silent: true as const })
        : command;
      commandsSubject$.next(resolvedCommand.execute(payload));
    },
  };
}
