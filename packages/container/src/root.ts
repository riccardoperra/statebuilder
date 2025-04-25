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

import {
  createRoot,
  getOwner,
  onCleanup,
  type Owner,
  runWithOwner,
} from 'solid-js';

type Disposable<T> = (dispoe: () => void) => T;

function createSubRoot<T>(
  fn: Disposable<T>,
  owner: Owner | null = getOwner(),
): T {
  return createRoot((dispose) => {
    owner && runWithOwner(owner, onCleanup.bind(void 0, dispose));
    return fn(dispose);
  }, owner!);
}

export function runInSubRoot<T>(fn: Disposable<T>, owner?: Owner): T {
  let error: unknown;
  const result = createSubRoot((dispose) => {
    try {
      return fn(dispose);
    } catch (e) {
      error = e;
      dispose();
      throw e;
    }
  }, owner);
  if (error) {
    throw error;
  }
  return result;
}
