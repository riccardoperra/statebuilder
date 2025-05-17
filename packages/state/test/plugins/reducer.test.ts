import { describe, expect, it } from 'vitest';
import { withReducer } from '~/plugins/reducer';
import { Container } from '@statebuilder/container';
import { defineSignal } from '~/solid/signal';

type Increment = { type: 'increment'; payload: number };

type Decrement = { type: 'decrement'; payload: number };

type AppActions = Increment | Decrement;

type AppState = {
  counter: number;
};

function appReducer(state: number, action: AppActions) {
  switch (action.type) {
    case 'increment':
      return state + action.payload;
    case 'decrement':
      return state - action.payload;
    default:
      return state;
  }
}

describe('reducer', () => {
  const container = Container.create();

  it('should update', () => {
    const config = defineSignal(() => 1).extend(withReducer(appReducer));

    const store = container.get(config);

    store.dispatch({ type: 'increment', payload: 5 });

    expect(store()).toEqual(6);
  });
});
