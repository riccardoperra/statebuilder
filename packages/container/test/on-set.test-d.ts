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

import { describe, expectTypeOf, it } from 'vitest';
import type { SetMeta } from '../src';
import { defineSignal } from './utils/signal';
import { defineStore } from './utils/store';

describe('onSet', () => {
  it('types the listener value as the store state', () => {
    defineStore(() => ({ count: 0 })).extend((_, context) => {
      context.onSet((value, meta) => {
        expectTypeOf(value).toEqualTypeOf<{ count: number }>();
        expectTypeOf(meta).toEqualTypeOf<SetMeta>();
      });
    });
    defineSignal(() => 'a').extend((_, context) => {
      context.onSet((value) => expectTypeOf(value).toEqualTypeOf<string>());
    });
  });
});
