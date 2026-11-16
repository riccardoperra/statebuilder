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

import { describe, expectTypeOf, test } from "vitest";
import { getMeta, setMeta } from "../../src/pluggino/meta.js";
import { makePluginKey, makePluginMeta } from "../../src/pluggino/index.js";

describe("setMeta", () => {
  test("allows to pass any type of value on generic keys", () => {
    setMeta("anyString", 123);
    setMeta("anyString", "");
    setMeta("anyString", {});
  });

  test("infer type by given plugin meta", () => {
    const meta = makePluginMeta<string>();
    setMeta(meta, "any-string");
    // @ts-expect-error Can pass only string
    setMeta(meta, 123);
  });

  test("infer type by given plugin key", () => {
    const meta = makePluginKey<number, string>();
    setMeta(meta, "any-string");
    // @ts-expect-error Can pass only string
    setMeta(meta, 123);
  });
});

describe("getMeta", () => {
  test("allows to pass any type of value on generic keys", () => {
    expectTypeOf(getMeta("anyString")).toEqualTypeOf<any>();
  });

  test("infer type by given plugin meta", () => {
    const meta = makePluginMeta<string>();
    expectTypeOf(getMeta(meta)).toEqualTypeOf<string>();
  });

  test("infer type by given plugin key", () => {
    const meta = makePluginKey<string, number>();
    expectTypeOf(getMeta(meta)).toEqualTypeOf<number>();
  });
});
