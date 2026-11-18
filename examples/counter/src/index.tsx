import { render } from '@solidjs/web';
import { StoreProvider } from 'statebuilder';
import './app.css';
import Counter from './components/Counter';

render(
  () => (
    <StoreProvider>
      <main>
        <h1>statebuilder counter</h1>
        <Counter />
      </main>
    </StoreProvider>
  ),
  document.getElementById('app')!,
);
