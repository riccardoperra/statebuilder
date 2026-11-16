import {
  createComponent,
  createContext,
  type FlowProps,
  getOwner,
  onCleanup,
  useContext,
} from 'solid-js';
import {
  Container,
  type ExtractStore,
  StateBuilderError,
  type StoreApiDefinition,
} from '@statebuilder/container';

const StoreProviderContext = createContext<Container>();

export type StoreProviderProps = FlowProps<{
  /**
   * Definitions that get their own instance in this provider, shared by the components below it.
   * Read once when the provider is created.
   */
  provide?: readonly StoreApiDefinition<any, any>[];
}>;

export function StoreProvider(props: StoreProviderProps) {
  const owner = getOwner();
  if (!owner) {
    throw new StateBuilderError(
      'Owner is missing. Cannot construct instance of Container',
    );
  }
  const container = Container.create({
    owner,
    parent: useContext(StoreProviderContext),
    provide: props.provide,
  });
  onCleanup(() => {
    container.destroy();
  });

  return createComponent(StoreProviderContext.Provider, {
    value: container,
    get children() {
      return props.children;
    },
  });
}

export function useContainer() {
  const container = useContext(StoreProviderContext);
  if (!container) {
    throw new StateBuilderError('No <StoreProvider> found in component tree');
  }
  return container;
}

export function useStore<TStoreDefinition extends StoreApiDefinition<any, any>>(
  definition: TStoreDefinition,
): ExtractStore<TStoreDefinition> {
  return useContainer().get(definition);
}
