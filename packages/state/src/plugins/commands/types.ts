import type {
  CommandPayload,
  CommandPhase,
  ExecutedCommandOf,
  ExecutedGenericStateCommand,
  GenericStateCommand,
  MapCommandToActions,
  StateCommand,
} from './command';
import type { GenericStoreApi } from '@statebuilder/container';
import type { ObservableObserver } from 'solid-js';

export type GenericCommandsMap = Record<PropertyKey, GenericStateCommand>;

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

export type CommandHandlers<
  T,
  Commands extends GenericCommandsMap,
  TSetter = any,
> = {
  [K in keyof Commands]: ExecuteCommandCallback<T, Commands[K], TSetter>;
};

export interface WatchCommandOptions {
  /**
   * `after` (default) emits when the handlers have run, `before` emits before
   * they run.
   */
  phase?: CommandPhase;
}

export interface StoreWithProxyCommands<
  TStoreApi extends GenericStoreApi,
  T,
  Commands extends GenericCommandsMap = GenericCommandsMap,
> {
  /** Attaches a handler to a command. A command can have several handlers. */
  hold<Command extends GenericStateCommand>(
    command: Command,
    callback: ExecuteCommandCallback<T, Command, TStoreApi['set']>,
  ): this;

  /** Attaches one handler to every command of the store. */
  hold(handlers: CommandHandlers<T, Commands, TStoreApi['set']>): this;

  dispatch<Command extends GenericStateCommand>(
    command: Command,
    payload: CommandPayload<Command>,
  ): void;

  readonly commands: Commands;

  readonly actions: MapCommandToActions<Commands>;

  watchCommand<Command extends GenericStateCommand>(
    commands: readonly Command[],
    options?: WatchCommandOptions,
  ): Observable<ExecutedCommandOf<Command>>;

  watchCommand(
    filter?: RegExp,
    options?: WatchCommandOptions,
  ): Observable<ExecutedGenericStateCommand>;
}

export type ProxifyCommands<T extends Record<string, unknown>> = {
  [K in keyof T]: StateCommand<K & string, T[K]>;
};

export interface Observable<T> {
  subscribe(observer: ObservableObserver<T>): {
    unsubscribe(): void;
  };

  [Symbol.observable](): Observable<T>;
}
