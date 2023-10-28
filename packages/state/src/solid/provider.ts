import {
  createComponent,
  createContext,
  FlowProps,
  getOwner,
  useContext,
} from 'solid-js';
import { Container } from '~/container';
import { ExtractStore, StoreApiDefinition } from '~/types';

const StateProviderContext = createContext<Container>();

export function StateProvider(props: FlowProps) {
  const owner = getOwner();
  if (!owner) {
    throw new Error(
      '[statebuilder] Owner is missing. Cannot construct instance of Container',
    );
  }
  const container = Container.create(owner);
  return createComponent(StateProviderContext.Provider, {
    value: container,
    get children() {
      return props.children;
    },
  });
}

export function getOptionalStateContext() {
  return useContext(StateProviderContext) ?? null;
}

export function getStateContext() {
  const container = useContext(StateProviderContext);
  if (!container) {
    throw new Error('No <StateProvider> found in component tree');
  }
  return container;
}

export function provideState<
  TStoreDefinition extends StoreApiDefinition<any, any>,
>(definition: TStoreDefinition): ExtractStore<TStoreDefinition> {
  const context = getStateContext();
  return context.get(definition);
}
