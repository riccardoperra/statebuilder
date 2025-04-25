import { makePlugin } from '@statebuilder/container';
import { Store } from '../../solid/store';
import { Signal } from '../../solid/signal';
import { GenericStoreApi } from '@statebuilder/container';

interface StoreWithReducer<T, Action> {
  dispatch(action: Action): void;
}

type Reducer<State, Action> = (state: State, action: Action) => State;

function reducerPlugin<TState, TAction>(
  reducer: Reducer<TState, TAction>,
): <TGenericApi extends GenericStoreApi<TState, any>>(
  ctx: TGenericApi,
) => StoreWithReducer<TState, TAction> {
  return (ctx) => {
    return {
      dispatch(action: TAction) {
        ctx.set((prevState: TState) => reducer(prevState, action));
      },
    };
  };
}

export const withReducer = <S, A>(reducer: (state: S, action: A) => S) =>
  makePlugin((store) => reducerPlugin(reducer)(store), { name: 'withReducer' });
