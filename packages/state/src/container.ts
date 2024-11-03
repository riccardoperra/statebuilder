import { getOwner, type Owner } from 'solid-js';
import { StateBuilderError } from '~/error';
import { runInSubRoot } from '~/root';
import { $CREATOR, resolve } from './api';
import { $SB_DEV, __devRegisterContainer } from './dev';
import { ExtractStore, GenericStoreApi, StoreApiDefinition } from './types';

export class Container {
  private readonly states = new Map<string, GenericStoreApi>();

  protected constructor(
    private readonly owner: Owner,
    private readonly parent?: Container,
  ) {
    $SB_DEV && __devRegisterContainer(this);
  }

  static create(owner?: Owner, parentContainer?: Container) {
    const resolvedOwner = owner ?? getOwner()!;
    if (!resolvedOwner) {
      console.warn(
        '[statebuilder] Using StateContainer without <StateProvider/> or `createRoot()` context is discouraged',
      );
    }
    return new Container(resolvedOwner, parentContainer);
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
      throw new StateBuilderError('No state $CREATOR found.', {
        cause: { state: state },
      });
    }
    try {
      const name = state[$CREATOR].name;
      const instance = this.#retrieveInstance(name);
      if (instance) {
        return instance as TypedStore;
      }
      const store = this.#resolveStore(this.owner, state);
      this.states.set(name, store!);
      return store as TypedStore;
    } catch (exception) {
      if (exception instanceof Error) throw exception;
      throw new StateBuilderError(
        'An error occurred during store initialization',
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

  #retrieveInstance(name: string): GenericStoreApi | null {
    let instance: GenericStoreApi | null = this.states.get(name) ?? null;
    if (instance) {
      return instance;
    }
    let currentParent = this.parent;
    while (currentParent) {
      instance = currentParent.states.get(name) ?? null;
      if (!!instance) {
        return instance;
      }
      currentParent = currentParent.parent;
    }
    return instance;
  }
}
