import {
  CommandPayload,
  GenericStateCommand,
  MapCommandToActions,
  StateCommand,
} from '~/plugins/commands/command';
import { GenericStoreApi } from '@statebuilder/container';
import { ExecuteCommandCallback } from '~/plugins/commands/notifier';
import { ObservableObserver } from 'solid-js';

export type GenericCommandsMap = Record<PropertyKey, GenericStateCommand>;

export interface StoreWithProxyCommands<
  TStoreApi extends GenericStoreApi,
  T,
  Commands extends Record<
    PropertyKey,
    GenericStateCommand
  > = GenericCommandsMap,
> {
  hold<Command extends GenericStateCommand>(
    command: Command,
    callback: ExecuteCommandCallback<T, Command, TStoreApi['set']>,
  ): this;

  dispatch<Command extends GenericStateCommand>(
    command: Command,
    payload: CommandPayload<Command>,
  ): void;

  readonly commands: Commands;

  readonly actions: MapCommandToActions<Commands>;

  watchCommand(regexp: RegExp): Observable<GenericStateCommand>;

  watchCommand<Command extends GenericStateCommand>(
    commands?: readonly Command[],
  ): Observable<Command>;
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
