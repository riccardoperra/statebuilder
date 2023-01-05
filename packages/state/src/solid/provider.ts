import { createComponent, createContext, FlowProps, getOwner, useContext } from 'solid-js';
import { Container } from '../container';
import { Store, StoreDefinition, StoreValue } from '../types';

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
  TStore extends StoreValue,
  TStoreExtension = {},
>(
  storeDef: StoreDefinition<TStore, TStoreExtension>,
): Store<TStore> & TStoreExtension {
  const context = useStateContext();
  return context.get(storeDef);
}
