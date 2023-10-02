export interface StateCommand<Identity extends string, T> {
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

class StateCommandImpl<Identity extends string, T>
  implements StateCommand<Identity, T>
{
  readonly silent?: boolean | undefined;

  constructor(public readonly identity: Identity) {}

  clone(): StateCommand<Identity, T> {
    return this.#clone(this, false);
  }

  withPayload<TPayload>(): StateCommand<
    Identity,
    unknown extends T ? TPayload : T | TPayload
  > {
    return this as {} as StateCommand<
      Identity,
      unknown extends T ? TPayload : T | TPayload
    >;
  }

  execute<TValue extends T>(
    payload: TValue,
  ): Readonly<
    Omit<this, 'execute' | 'with' | 'clone' | 'withPayload'> & {
      consumerValue: TValue;
      executionDate: string;
    }
  > {
    return this.#extend(
      this,
      {
        consumerValue: payload,
        executionDate: new Date().toISOString(),
      },
      true,
    );
  }

  with<TMetadata extends object>(metadata: TMetadata): this & TMetadata {
    return this.#extend(this, metadata, false);
  }

  #extend<TStateCommand extends StateCommand<any, any>, T>(
    command: TStateCommand,
    metadata: T,
    readonly: boolean,
  ) {
    const clonedCommand = this.#clone(command, readonly);
    return Object.assign(clonedCommand, metadata);
  }

  #clone<TStateCommand extends StateCommand<any, any>>(
    command: TStateCommand,
    readonly: boolean,
  ): TStateCommand {
    const base = readonly ? {} : createCommand(command.identity);
    return Object.assign(base, JSON.parse(JSON.stringify(command)));
  }
}

export function createCommand<Identity extends string, T = unknown>(
  identity: Identity,
): StateCommand<Identity, T> {
  return new StateCommandImpl(identity);
}

export type MapCommandToActions<T extends Record<string, GenericStateCommand>> =
  {
    [K in keyof T]: (payload: CommandPayload<T[K]>) => void;
  };
