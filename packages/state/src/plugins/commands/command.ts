export interface StateCommand<
  Identity extends string,
  T,
  // eslint-disable-next-line @typescript-eslint/ban-types
> {
  identity: string;

  readonly silent?: boolean;

  clone(): StateCommand<Identity, T>;

  withPayload<TPayload>(): StateCommand<
    Identity,
    unknown extends T ? TPayload : T | TPayload
  >;

  execute<TValue extends T>(
    payload: TValue,
  ): ExecutedStateCommand<Identity, TValue, this>;

  with<TMetadata extends object>(metadata: TMetadata): this & TMetadata;
}

export type ExecutedStateCommand<
  Identity extends string,
  T,
  TStateCommand extends StateCommand<Identity, T>,
> = Readonly<
  Omit<TStateCommand, 'execute' | 'with' | 'clone' | 'withPayload'> & {
    consumerValue: T;
    executionDate: string;
  }
>;

export type GenericStateCommand = StateCommand<string, unknown>;
export type ExecutedGenericStateCommand = ExecutedStateCommand<
  string,
  unknown,
  StateCommand<any, any>
>;

type GetCommandInfo<T extends GenericStateCommand> = T extends StateCommand<
  infer TIdentity,
  infer TPayload
>
  ? { identity: TIdentity; payload: TPayload }
  : never;

export type CommandIdentity<T extends GenericStateCommand> =
  GetCommandInfo<T>['identity'];

export type CommandPayload<T extends GenericStateCommand> =
  GetCommandInfo<T>['payload'];

function clone<TStateCommand extends StateCommand<any, any>>(
  command: TStateCommand,
  readonly: boolean,
): TStateCommand {
  const base = readonly ? {} : createCommand(command.identity);
  return Object.assign(base, JSON.parse(JSON.stringify(command)));
}

function extend<TStateCommand extends StateCommand<any, any>, T>(
  command: TStateCommand,
  metadata: T,
  readonly: boolean,
) {
  const clonedCommand = clone(command, readonly);
  return Object.assign(clonedCommand, metadata);
}

export function createCommand<Identity extends string, T = unknown>(
  identity: Identity,
): StateCommand<Identity, T> {
  return {
    identity,
    withPayload() {
      return this;
    },
    clone(): StateCommand<Identity, T> {
      return clone(this, false);
    },
    with(metadata) {
      return extend(this, metadata, false);
    },
    execute<TValue extends T>(
      payload: TValue,
    ): ExecutedStateCommand<Identity, TValue, StateCommand<Identity, T>> {
      return extend(
        this,
        {
          consumerValue: payload,
          executionDate: new Date().toISOString(),
        },
        true,
      );
    },
  };
}

export type MapCommandToActions<T extends Record<string, GenericStateCommand>> =
  {
    [K in keyof T]: (payload: CommandPayload<T[K]>) => void;
  };
