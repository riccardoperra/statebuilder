import { getOwner, onCleanup, untrack } from 'solid-js';
import {
  createPlugin,
  type ContainerPluginContext,
  type GenericStoreApi,
} from '@statebuilder/container';

type AnyFunction = (...args: any[]) => any;

export type ActionMap = Record<string, AnyFunction>;

export type Action<F extends AnyFunction> = F & {
  /** Runs the action without calling the `onAction` listeners. */
  readonly silent: (...args: Parameters<F>) => ReturnType<F>;
};

export type BoundActions<A extends ActionMap> = {
  readonly [K in keyof A]: Action<A[K]>;
};

export type ActionEvent<A extends ActionMap, K extends keyof A = keyof A> = {
  [P in K]: { readonly name: P; readonly args: Parameters<A[P]> };
}[K];

export type ActionPhase = 'before' | 'after';

export interface OnActionOptions {
  /**
   * `before` runs before the action. `after` (the default) runs when the
   * action returns. For an action that returns a promise, that is before the
   * promise settles.
   */
  phase?: ActionPhase;
}

export interface OnAction<A extends ActionMap> {
  <K extends keyof A & string>(
    name: K | readonly K[],
    listener: (event: ActionEvent<A, K>) => void,
    options?: OnActionOptions,
  ): () => void;
  (
    listener: (event: ActionEvent<A>) => void,
    options?: OnActionOptions,
  ): () => void;
}

export interface StoreActions<A extends ActionMap> {
  readonly actions: BoundActions<A>;
  /**
   * Listens to actions of this store. Returns an unsubscribe function. The
   * listener is also removed on cleanup of the current owner, when there is one.
   */
  readonly onAction: OnAction<A>;
}

type ActionsOf<S> = S extends { actions: infer B }
  ? { [K in keyof B]: B[K] extends { silent: infer F } ? F : never }
  : {};

type MergeActions<S, A extends ActionMap> = Omit<ActionsOf<S>, keyof A> & A;

interface Listener {
  readonly names: ReadonlySet<string> | undefined;
  readonly phase: ActionPhase;
  readonly listener: (event: ActionEvent<ActionMap, string>) => void;
}

interface Registry {
  readonly actions: Record<string, Action<AnyFunction>>;
  listeners: readonly Listener[];
  readonly onAction: OnAction<ActionMap>;
}

// Keyed by the resolved store, so a second withActions on the same store
// shares the action map and the listeners of the first.
const registries = new WeakMap<GenericStoreApi, Registry>();

function createRegistry(): Registry {
  const registry: Registry = {
    actions: {},
    listeners: [],
    onAction(...args: unknown[]) {
      const [names, listener, options] =
        typeof args[0] === 'function'
          ? [undefined, args[0], args[1]]
          : [args[0], args[1], args[2]];
      const entry: Listener = {
        names:
          names === undefined
            ? undefined
            : new Set(
                typeof names === 'string' ? [names] : (names as string[]),
              ),
        phase: (options as OnActionOptions | undefined)?.phase ?? 'after',
        listener: listener as Listener['listener'],
      };
      registry.listeners = [...registry.listeners, entry];
      const off = () => {
        registry.listeners = registry.listeners.filter((e) => e !== entry);
      };
      if (getOwner()) onCleanup(off);
      return off;
    },
  };
  return registry;
}

function emit(
  registry: Registry,
  phase: ActionPhase,
  event: ActionEvent<ActionMap, string>,
) {
  for (const entry of registry.listeners) {
    if (entry.phase !== phase) continue;
    if (entry.names && !entry.names.has(event.name)) continue;
    entry.listener(event);
  }
}

/**
 * Adds `actions` and `onAction` to a store. Each action runs inside `batch`
 * and `untrack`, and the writes it does synchronously reach `onSet` with
 * `meta.action`. Inside an action, `this` is the map of bound actions.
 */
export function withActions<S extends GenericStoreApi, A extends ActionMap>(
  factory: (
    store: S,
    context: ContainerPluginContext<S>,
  ) => A & ThisType<BoundActions<A>>,
): (
  store: S,
  context: ContainerPluginContext<S>,
) => StoreActions<MergeActions<S, A>> {
  const plugin = (
    store: S,
    context: ContainerPluginContext<S>,
  ): StoreActions<MergeActions<S, A>> => {
    const registry = registries.get(store) ?? createRegistry();
    if (!registries.has(store)) {
      registries.set(store, registry);
      context.onDispose(() => (registry.listeners = []));
    }
    const { actions, onAction } = registry;
    const run = (
      name: string,
      fn: AnyFunction,
      args: unknown[],
      silent: boolean,
    ) =>
      untrack(() => {
        const event = { name, args };
        if (!silent) emit(registry, 'before', event);
        const result = context.runInAction(event, () =>
          fn.apply(actions, args),
        );
        if (!silent) emit(registry, 'after', event);
        return result;
      });

    for (const [name, fn] of Object.entries(factory(store, context))) {
      actions[name] = Object.assign(
        (...args: unknown[]) => run(name, fn, args, false),
        { silent: (...args: unknown[]) => run(name, fn, args, true) },
      );
    }

    return { actions, onAction } as unknown as StoreActions<MergeActions<S, A>>;
  };

  return createPlugin(plugin as Parameters<typeof createPlugin>[0], {
    name: 'withActions',
  }) as unknown as typeof plugin;
}
