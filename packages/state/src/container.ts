import { getOwner, Owner, runWithOwner } from 'solid-js';
import { $EXTENSION, $NAME, makeStore } from './store';
import { Store, StoreDefinition, StoreValue } from './types';

export class Container {
  private readonly states = new Map<string, Store<StoreValue>>();

  protected constructor(private readonly owner: Owner) {}

  static create(owner?: Owner) {
    const resolvedOwner = owner ?? getOwner()!;
    if (!resolvedOwner) {
      console.warn(
        '[statesolid] Using StateContainer without <StateProvider/> or `createRoot()` context is discouraged'
      );
    }
    return new Container(resolvedOwner);
  }

  get<TStore extends StoreValue, TStoreExtension = {}>(
    state: StoreDefinition<TStore, TStoreExtension>
  ): Store<TStore> & TStoreExtension {
    type TypedStore = Store<TStore> & TStoreExtension;

    try {
      const name = state[$NAME];
      const instance = this.states.get(state[$NAME]);
      if (instance) {
        return instance as unknown as TypedStore;
      }

      const store = runWithOwner(this.owner, () => {
        const internalStore = makeStore({
          initialValue: state.initialValue,
        });
        return state[$EXTENSION].reduce(
          (acc, extension) => Object.assign(acc, extension(acc)),
          internalStore
        );
      });

      this.states.set(name, store as unknown as Store<StoreValue>);

      return store as TypedStore;
    } catch (e) {
      throw new Error('Cannot initialize store correctly', {
        cause: e,
      });
    }
  }
}
