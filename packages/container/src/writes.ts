/*
 * Copyright 2025 Riccardo Perra
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { untrack } from './reactivity';
import type {
  ActionMeta,
  GenericStoreApi,
  SetListener,
  SetMeta,
} from './types';

export interface StoreWrites {
  onSet(listener: SetListener<unknown>): () => void;
  runInAction<R>(action: ActionMeta, fn: () => R): R;
  wrap<TSet extends (...args: any[]) => unknown>(set: TSet): TSet;
  clear(): void;
}

export function createStoreWrites(store: GenericStoreApi): StoreWrites {
  let listeners: readonly SetListener<unknown>[] = [];
  let action: ActionMeta | undefined;
  // A set that calls the set it overrides notifies once, from the outermost call.
  let depth = 0;

  const notify = () => {
    const current = listeners;
    if (current.length === 0) return;
    const meta: SetMeta = action ? { action } : {};
    // Untracked, so a listener's reads do not subscribe the computation that wrote.
    untrack(() => {
      const value = store.peek();
      for (const listener of current) listener(value, meta);
    });
  };

  return {
    onSet(listener) {
      listeners = [...listeners, listener];
      return () => {
        listeners = listeners.filter((entry) => entry !== listener);
      };
    },
    runInAction(next, fn) {
      const previous = action;
      action = next;
      try {
        return fn();
      } finally {
        action = previous;
      }
    },
    wrap(set) {
      return ((...args: unknown[]) => {
        depth++;
        let result: unknown;
        try {
          result = set(...args);
        } finally {
          depth--;
        }
        if (depth === 0) notify();
        return result;
      }) as typeof set;
    },
    clear() {
      listeners = [];
    },
  };
}
