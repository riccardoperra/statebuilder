import { getOwner, type Owner } from 'solid-js';
import { ExtractStore, GenericStoreApi, StoreApiDefinition } from './types';
import { $CREATOR, resolve } from './api';
import { runInSubRoot } from '~/root';
import { getOptionalStateContext } from '~/solid/provider';

export class Container {
  private readonly states = new Map<string, GenericStoreApi>();

  protected constructor(private readonly owner: Owner) {}

  static create(owner?: Owner) {
    const resolvedOwner = owner ?? getOwner()!;
    if (!resolvedOwner) {
      console.warn(
        '[statebuilder] Using StateContainer without <StateProvider/> or `createRoot()` context is discouraged',
      );
    }
    return new Container(resolvedOwner);
  }

  remove<TStoreDefinition extends StoreApiDefinition<any, any>>(
    state: TStoreDefinition,
  ): void {
    this.states.delete(state[$CREATOR].name);
  }

  get<TStoreDefinition extends StoreApiDefinition<any, any>>(
    state: TStoreDefinition,
  ): ExtractStore<TStoreDefinition> {
    type TypedStore = ExtractStore<TStoreDefinition>;
    if (!state[$CREATOR]) {
      throw new Error('[statebuilder] No state $CREATOR found.', {
        cause: { state: state },
      });
    }
    try {
      const name = state[$CREATOR].name;
      const instance = this.recursivelySearchStateFromContainer(name);
      if (instance) {
        return instance as TypedStore;
      }
      const store = this.#resolveStore(this.owner, state);
      this.states.set(name, store!);
      return store as TypedStore;
    } catch (exception) {
      if (exception instanceof Error) throw exception;
      throw new Error(
        '[statebuilder] An error occurred during store initialization',
        { cause: exception },
      );
    }
  }

  #resolveStore<TStoreDefinition extends StoreApiDefinition<any, any>>(
    owner: Owner,
    state: TStoreDefinition,
  ): GenericStoreApi {
    return runInSubRoot(() => resolve(state, this), owner);
  }

  private recursivelySearchStateFromContainer(
    name: string,
  ): GenericStoreApi | null {
    let instance: GenericStoreApi | null;
    instance = this.states.get(name) ?? null;
    if (!instance && this.owner?.owner) {
      const parentContainer = runInSubRoot((dispose) => {
        const value = getOptionalStateContext();
        dispose();
        return value;
      }, this.owner.owner);
      if (parentContainer) {
        instance = parentContainer.recursivelySearchStateFromContainer(name);
      }
    }
    return instance || null;
  }
}
