import { createPlugin, type GenericStoreApi } from 'statebuilder';

export interface WithEntitiesOptions<T, Id> {
  selectId: (entity: T) => Id;
}

export interface Entities<T, Id> {
  byId(id: Id): T | undefined;
  /** Appends an entity. Use `upsert` when it may already exist. */
  add(entity: T): void;
  /** Merges `patch` into the entity, or replaces it with what `fn` returns. */
  update(id: Id, patch: Partial<T> | ((entity: T) => T)): void;
  remove(id: Id): void;
  /** Replaces the entity with the same id, or appends it. */
  upsert(entity: T): void;
}

/** For a store or a signal whose state is `T[]`. */
export function withEntities<T, Id>(options: WithEntitiesOptions<T, Id>) {
  const { selectId } = options;

  return createPlugin(
    (store: GenericStoreApi<T[]>) => {
      const update = (fn: (entities: T[]) => T[]) => store.set(fn);

      const entities: Entities<T, Id> = {
        byId: (id) => store().find((entity) => selectId(entity) === id),
        add: (entity) => update((list) => [...list, entity]),
        update: (id, patch) =>
          update((list) =>
            list.map((entity) => {
              if (selectId(entity) !== id) return entity;
              return typeof patch === 'function'
                ? patch(entity)
                : { ...entity, ...patch };
            }),
          ),
        remove: (id) =>
          update((list) => list.filter((entity) => selectId(entity) !== id)),
        upsert: (entity) =>
          update((list) => {
            const id = selectId(entity);
            return list.some((item) => selectId(item) === id)
              ? list.map((item) => (selectId(item) === id ? entity : item))
              : [...list, entity];
          }),
      };

      return { entities };
    },
    { name: 'withEntities' },
  );
}
