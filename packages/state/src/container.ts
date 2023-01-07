import { getOwner, Owner, runWithOwner } from 'solid-js';
import { GenericStoreApi, StoreApiDefinition, ExtractStore } from './types';
import { $EXTENSION, $NAME, $STOREDEF } from './api';

export class Container {
  private readonly states = new Map<string, GenericStoreApi>();

  protected constructor(private readonly owner: Owner) {}

  static create(owner?: Owner) {
    const resolvedOwner = owner ?? getOwner()!;
    if (!resolvedOwner) {
      console.warn(
        '[statesolid] Using StateContainer without <StateProvider/> or `createRoot()` context is discouraged',
      );
    }
    return new Container(resolvedOwner);
  }

  get<TStoreDefinition extends StoreApiDefinition<any, any>>(
    state: TStoreDefinition,
  ): ExtractStore<TStoreDefinition> {
    type TypedStore = ExtractStore<TStoreDefinition>;

    try {
      const name = state[$NAME];
      const instance = this.states.get(state[$NAME]);
      if (instance) {
        return instance as unknown as TypedStore;
      }
      const store = runWithOwner(this.owner, () => {
        const creatorFn = state[$STOREDEF];
        return state[$EXTENSION].reduce(
          (acc, extension) => Object.assign(acc, extension(acc)),
          creatorFn(),
        );
      });
      this.states.set(name, store);
      return store as TypedStore;
    } catch (e) {
      throw new Error('Cannot initialize store correctly', {
        cause: e,
      });
    }
  }
}
