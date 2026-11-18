import { untrack } from 'solid-js';
import { $SB_DEV, type GenericStoreApi } from '@statebuilder/container';
import type {
  CommandPhase,
  ExecutedGenericStateCommand,
  GenericStateCommand,
} from './command';
import type {
  CommandObserver,
  ExecuteCommandCallback,
  Observable,
  WatchCommandOptions,
} from './types';

type RunInAction = <R>(
  action: { name: string; args: readonly unknown[] },
  fn: () => R,
) => R;

type Filter = readonly GenericStateCommand[] | RegExp | undefined;

// Shared by every store: one call hides the commands of all the stores it writes.
let untracked = 0;

/**
 * Runs `cb` with its commands hidden from `watchCommand` subscribers. The
 * handlers still run. With `async`, commands stay hidden until the next
 * microtask.
 */
export function untrackCommand<R>(cb: () => R, async = false): R {
  untracked++;
  const restore = () => void untracked--;
  try {
    return cb();
  } finally {
    if (async) queueMicrotask(restore);
    else restore();
  }
}

function matches(filter: Filter, identity: string): boolean {
  if (filter === undefined) return true;
  if (filter instanceof RegExp) return filter.test(identity);
  return filter.some((command) => command.identity === identity);
}

export function makeCommandNotifier<T>(
  store: GenericStoreApi<T>,
  runInAction: RunInAction,
  isDeclared: (identity: string) => boolean,
) {
  const handlers = new Map<
    string,
    ExecuteCommandCallback<T, GenericStateCommand>[]
  >();
  const watchers = new Set<(command: ExecutedGenericStateCommand) => void>();
  const warned = new Set<string>();

  function emit(identity: string, consumerValue: unknown, phase: CommandPhase) {
    if (watchers.size === 0) return;
    const command = { identity, consumerValue, phase };
    for (const watcher of [...watchers]) watcher(command);
  }

  return {
    hold(
      identity: string,
      callback: ExecuteCommandCallback<T, GenericStateCommand>,
    ): void {
      const current = handlers.get(identity);
      if (current) current.push(callback);
      else handlers.set(identity, [callback]);
    },

    dispatch(command: GenericStateCommand, payload: unknown): void {
      const { identity } = command;
      const tracked = untracked === 0;
      const callbacks = handlers.get(identity);

      if (
        $SB_DEV &&
        !callbacks &&
        isDeclared(identity) &&
        !warned.has(identity)
      ) {
        warned.add(identity);
        console.warn(
          `[statebuilder] The command "${identity}" was dispatched but no handler is attached to it. Attach one with hold().`,
        );
      }

      if (tracked) emit(identity, payload, 'before');

      if (callbacks) {
        runInAction({ name: identity, args: [payload] }, () =>
          untrack(() => {
            for (const callback of [...callbacks]) {
              const result = callback(payload, {
                set: store.set,
                // Includes the writes of the handlers that ran before this one.
                state: store.peek(),
              });
              if (result !== undefined) store.set(() => result);
            }
          }),
        );
      }

      if (tracked) emit(identity, payload, 'after');
    },

    watchCommand(
      filter?: Filter,
      options?: WatchCommandOptions,
    ): Observable<ExecutedGenericStateCommand> {
      const phase = options?.phase ?? 'after';
      return {
        [Symbol.observable || '@@observable']() {
          return this;
        },
        subscribe(observer: CommandObserver<ExecutedGenericStateCommand>) {
          const next =
            typeof observer === 'function'
              ? observer
              : observer.next?.bind(observer);
          if (!next) return { unsubscribe() {} };

          const watcher = (command: ExecutedGenericStateCommand) => {
            if (command.phase === phase && matches(filter, command.identity)) {
              next(command);
            }
          };
          watchers.add(watcher);
          return {
            unsubscribe() {
              watchers.delete(watcher);
            },
          };
        },
      };
    },
  };
}
