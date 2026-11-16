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

interface EventsMap {
  [event: string | symbol]: any;
}

interface DefaultEvents extends EventsMap {
  [event: string]: (...args: any) => void;
}

/**
 * @internal
 */
export interface Unsubscribe {
  (): void;
}

/**
 * @internal
 */
export interface Emitter<TEvents extends EventsMap = DefaultEvents> {
  emit: <TKeys extends keyof TEvents>(
    this: this,
    event: TKeys,
    ...args: Parameters<TEvents[TKeys]>
  ) => void;

  events: Partial<{ [E in keyof TEvents]: Array<TEvents[E]> }>;

  on: <TKeys extends keyof TEvents>(
    this: this,
    event: TKeys,
    cb: TEvents[TKeys],
    options?: { once: boolean },
  ) => Unsubscribe;
}

/**
 * @internal
 */
export function emitter<
  TEvents extends EventsMap = DefaultEvents,
>(): Emitter<TEvents> {
  return {
    emit(event, ...args) {
      const callbacks = this.events[event] || [];
      for (let i = 0, length = callbacks.length; i < length; i++) {
        callbacks[i](...args);
      }
    },
    events: {},
    on(event, _cb, options) {
      const cb = !options?.once
        ? _cb
        : (((...args: Array<any>) => {
            _cb(...args);
            cleanup();
          }) as typeof _cb);
      (this.events[event] ||= []).push(cb);
      const cleanup = () => {
        this.events[event] = this.events[event]?.filter((i) => cb !== i);
      };
      return cleanup;
    },
  };
}
