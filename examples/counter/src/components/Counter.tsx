import './Counter.css';
import { defineStore } from 'rstate';

export default function Counter() {
  const store = defineStore({
    count: 0,
  });

  return (
    <button class='increment'
            onClick={() => store.set('count', count => count + 1)}>
      Clicks: {store.state.count}
    </button>
  );
}
