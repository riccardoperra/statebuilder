import { MetaProvider, Title } from '@solidjs/meta';
import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { Suspense } from 'solid-js';
import './app.css';
import { StateProvider } from 'statebuilder';

export default function App() {
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <Title>SolidStart - Basic</Title>
          <a href="/">Index</a>
          <a href="/about">About</a>
          <StateProvider>
            <Suspense>{props.children}</Suspense>
          </StateProvider>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
