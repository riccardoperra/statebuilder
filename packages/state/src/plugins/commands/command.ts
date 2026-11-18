declare const $payload: unique symbol;

export interface StateCommand<Identity extends string, T> {
  readonly identity: Identity;

  /** Type only. Carries the payload type of the command. */
  readonly [$payload]: T;

  withPayload<TPayload>(): StateCommand<
    Identity,
    unknown extends T ? TPayload : T | TPayload
  >;
}

export type CommandPhase = 'before' | 'after';

/** What a `watchCommand` subscriber receives. */
export interface ExecutedStateCommand<Identity extends string, T> {
  readonly identity: Identity;
  readonly consumerValue: T;
  readonly phase: CommandPhase;
}

export type GenericStateCommand = StateCommand<string, any>;
export type ExecutedGenericStateCommand = ExecutedStateCommand<string, unknown>;

export type CommandIdentity<T extends GenericStateCommand> =
  T extends StateCommand<infer TIdentity, any> ? TIdentity : never;

export type CommandPayload<T extends GenericStateCommand> =
  T extends StateCommand<string, infer TPayload> ? TPayload : never;

export type ExecutedCommandOf<T extends GenericStateCommand> =
  T extends StateCommand<infer TIdentity, infer TPayload>
    ? ExecutedStateCommand<TIdentity, TPayload>
    : never;

export function createCommand<Identity extends string, T = unknown>(
  identity: Identity,
): StateCommand<Identity, T> {
  const command = {
    identity,
    withPayload: () => command,
  };
  return command as unknown as StateCommand<Identity, T>;
}

export type MapCommandToActions<T extends Record<string, GenericStateCommand>> =
  {
    [K in keyof T]: (payload: CommandPayload<T[K]>) => void;
  };
