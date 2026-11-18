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

import { describe, expect, test, vi } from 'vitest';
import { getMeta, setMeta } from '../../src/pluggino/meta.js';
import { makePluginKey, makePluginMeta } from '../../src/pluggino/index.js';
import type { MetaStore } from '../../src/pluggino/meta.js';

describe('setMeta', () => {
  test('set by key', () => {
    const obj: MetaStore = {};
    setMeta.bind(obj)('foo', 'bar');
    expect(obj).toHaveProperty('foo', 'bar');
  });

  test('set by meta key', () => {
    const obj: MetaStore = {};
    const key = makePluginMeta<number>();
    setMeta.bind(obj)(key, 1);
    expect(obj[key]).toEqual(1);
  });

  test('set by meta plugin', () => {
    const obj: MetaStore = {};
    const key = makePluginKey<string, number>();
    setMeta.bind(obj)(key, 1);
    expect(obj[key.ɵmeta]).toEqual(1);
  });
});

describe('getMeta', () => {
  test('get by string', () => {
    const obj: MetaStore = {};
    obj['foo'] = 'bar';
    expect(getMeta.bind(obj)('foo')).toEqual('bar');
  });

  test('get by meta key', () => {
    const obj: MetaStore = {};
    const key = makePluginMeta<number>();
    obj[key] = 1;
    expect(getMeta.bind(obj)(key)).toEqual(1);
  });

  test('get by meta plugin', () => {
    const obj: MetaStore = {};
    const key = makePluginKey<any, number>();
    setMeta.bind(obj)(key, 99);
    expect(getMeta.bind(obj)(key)).toEqual(99);
  });
});
