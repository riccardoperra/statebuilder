import { describe, expect, it } from 'vitest';
import { render } from '@solidjs/testing-library';
import { provideState, StateProvider } from '../src/solid';
import { defineStore } from '~/solid/store';

describe('provider', () => {
  const counter = defineStore(() => ({ count: 0 })).extend((ctx) => ({
    increment: () => ctx.set('count', (count) => count + 1),
  }));

  function App() {
    const state = provideState(counter);
    return (
      <button
        data-testId="button"
        onClick={state.increment}
      >
        {state().count}
      </button>
    );
  }

  it('should use container from context', async () => {
    const results = render(() => (
      <StateProvider>
        <App />
      </StateProvider>
    ));

    const btn = await results.findByTestId('button');
    expect(btn.innerText).toEqual('0');

    btn.click();

    expect(btn.innerText).toEqual('1');
  });

  it('should share state', async () => {
    const results = render(() => (
      <StateProvider>
        <App />
        <App />
        <App />
      </StateProvider>
    ));

    const buttons = await results.findAllByTestId('button');
    expect(buttons.length).toEqual(3);
    expect(buttons.map((_) => _.innerText)).toEqual(['0', '0', '0']);

    buttons[0].click();

    expect(buttons.map((_) => _.innerText)).toEqual(['1', '1', '1']);
  });

  it('should throw error', async () => {
    expect(() => render(() => <App />)).toThrowError(
      new Error('No <StateProvider> found in component tree'),
    );
  });
});
