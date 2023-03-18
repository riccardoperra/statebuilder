export interface StateCommand<
  Identity extends string,
  T,
  // eslint-disable-next-line @typescript-eslint/ban-types
> {
  identity: string;

  readonly silent?: boolean;

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
  Omit<TStateCommand, 'withPayload' | 'execute'> & {
    consumerValue: T;
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

export function createCommand<Identity extends string, T = unknown>(
  identity: Identity,
): StateCommand<Identity, T> {
  return {
    identity,
    withPayload() {
      return this;
    },
    with(metadata) {
      return Object.assign(this, metadata);
    },
    execute<TValue extends T>(
      payload: TValue,
    ): ExecutedStateCommand<Identity, TValue, StateCommand<Identity, T>> {
      return this.with({ consumerValue: payload });
    },
  };
}

export type MapCommandToActions<T extends Record<string, GenericStateCommand>> =
  {
    [K in keyof T]: (payload: CommandPayload<T[K]>) => void;
  };
