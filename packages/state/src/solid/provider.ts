import {
  createComponent,
  createContext,
  FlowProps,
  getOwner,
  useContext,
} from 'solid-js';
import { Container, InjectFlags } from '~/container';
import { StoreApiDefinition, ExtractStore } from '~/types';

const StateProviderContext = createContext<Container>();

export function StateProvider(props: FlowProps) {
  const owner = getOwner();
  if (!owner) {
    throw new Error('Owner missing');
  }
  const container = Container.create(owner);
  return createComponent(StateProviderContext.Provider, {
    value: container,
    get children() {
      return props.children;
    },
  });
}

function useStateContext() {
  const ctx = useContext(StateProviderContext);
  if (ctx) {
    return ctx;
  }
  throw new Error('No <StateProvider> found in component tree');
}

export function provideState<
  TStoreDefinition extends StoreApiDefinition<any, any>,
>(
  definition: TStoreDefinition,
  flags?: InjectFlags,
): ExtractStore<TStoreDefinition> {
  const context = useStateContext();
  return context.get(definition, flags);
}
