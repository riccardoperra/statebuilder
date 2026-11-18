import { describe, expect, it } from 'vitest';
import { render } from '@solidjs/testing-library';
import { createContext, flush, useContext } from 'solid-js';
import { StoreProvider, useContainer, useStore } from '../src/solid';
import { defineStore } from '../src/solid';
import { StateBuilderError } from '../src/index';

describe('provider', () => {
  const counter = defineStore(() => ({ count: 0 })).extend((ctx) => ({
    increment: () =>
      ctx.set((state) => {
        state.count += 1;
      }),
  }));

  function App() {
    const state = useStore(counter);
    return (
      <button
        data-testId="button"
        onClick={state.increment}
      >
        {state().count}
      </button>
    );
  }

  const texts = (buttons: HTMLElement[]) => buttons.map((_) => _.textContent);

  it('should use container from context', async () => {
    const results = render(() => (
      <StoreProvider>
        <App />
      </StoreProvider>
    ));

    const btn = await results.findByTestId('button');
    expect(btn.textContent).toEqual('0');

    btn.click();
    flush();

    expect(btn.textContent).toEqual('1');
  });

  it('should share state', async () => {
    const results = render(() => (
      <StoreProvider>
        <App />
        <App />
        <App />
      </StoreProvider>
    ));

    const buttons = await results.findAllByTestId('button');
    expect(buttons.length).toEqual(3);
    expect(texts(buttons)).toEqual(['0', '0', '0']);

    buttons[0].click();
    flush();

    expect(texts(buttons)).toEqual(['1', '1', '1']);
  });

  it('shares the root store with a nested provider that does not provide it', async () => {
    const results = render(() => (
      <StoreProvider>
        <StoreProvider>
          <App />
        </StoreProvider>
        <App />
      </StoreProvider>
    ));

    const buttons = await results.findAllByTestId('button');
    buttons[0].click();
    flush();

    expect(texts(buttons)).toEqual(['1', '1']);
  });

  it('gives each providing StoreProvider its own store', async () => {
    const results = render(() => (
      <StoreProvider>
        <StoreProvider provide={[counter]}>
          <App />
          <App />
        </StoreProvider>
        <StoreProvider provide={[counter]}>
          <App />
        </StoreProvider>
        <App />
      </StoreProvider>
    ));

    const buttons = await results.findAllByTestId('button');
    buttons[0].click();
    flush();

    expect(texts(buttons)).toEqual(['1', '1', '0', '0']);
  });

  it('creates a provided store that reads a Solid context above its provider', () => {
    const Theme = createContext('default');
    const ThemedStore = defineStore(() => ({ theme: useContext(Theme) }));
    let theme: string | undefined;

    function Reader() {
      theme = useStore(ThemedStore).peek().theme;
      return null;
    }

    render(() => (
      <StoreProvider>
        <Theme value="dark">
          <StoreProvider provide={[ThemedStore]}>
            <Reader />
          </StoreProvider>
        </Theme>
      </StoreProvider>
    ));

    expect(theme).toBe('dark');
  });

  it('should throw error', async () => {
    expect(() => render(() => <App />)).toThrowError(StateBuilderError);
    expect(() =>
      render(() => {
        useContainer();
        return null;
      }),
    ).toThrowError(StateBuilderError);
  });
});
