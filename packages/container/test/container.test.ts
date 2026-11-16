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

import { describe, expect, it, vi } from 'vitest';
import { Container, StateBuilderError } from '../src';
import { createRoot, getOwner } from 'solid-js';
import { defineSignal } from './utils/signal';

function chain(provide: Parameters<typeof Container.create>[0] = {}) {
  return createRoot((dispose) => {
    const root = Container.create({ owner: getOwner()! });
    const child = Container.create({
      owner: getOwner()!,
      parent: root,
      ...provide,
    });
    return { root, child, dispose };
  });
}

describe('Container', () => {
  it('should create container', () =>
    createRoot(() => {
      const container = Container.create({ owner: getOwner()! });
      expect(container instanceof Container).toBe(true);
    }));

  it('returns the same store on every get', () =>
    createRoot(() => {
      const container = Container.create({ owner: getOwner()! });
      const def = defineSignal(() => 0);

      expect(container.get(def)).toBe(container.get(def));
    }));
});

describe('Container scope', () => {
  it('resolves an unprovided definition in the root when the child asks first', () => {
    const def = defineSignal(() => 0);
    const { root, child } = chain();

    const fromChild = child.get(def);

    expect(root.get(def)).toBe(fromChild);
  });

  it('resolves an unprovided definition in the root when the parent asks first', () => {
    const def = defineSignal(() => 0);
    const { root, child } = chain();

    const fromRoot = root.get(def);

    expect(child.get(def)).toBe(fromRoot);
  });

  it('gives each provider its own instance of a provided definition', () => {
    const def = defineSignal(() => 0);
    const root = createRoot(() => Container.create({ owner: getOwner()! }));
    const [first, second] = [1, 2].map(() =>
      createRoot(() =>
        Container.create({ owner: getOwner()!, parent: root, provide: [def] }),
      ),
    );

    first.get(def).set(1);
    second.get(def).set(2);

    expect(first.get(def)()).toBe(1);
    expect(second.get(def)()).toBe(2);
    expect(root.get(def)()).toBe(0);
  });

  it('resolves a provided definition for the containers below its provider', () => {
    const def = defineSignal(() => 0);
    const { child } = chain({ provide: [def] });
    const grandchild = createRoot(() =>
      Container.create({ owner: getOwner()!, parent: child }),
    );

    expect(grandchild.get(def)).toBe(child.get(def));
  });

  it('disposes a local store with its provider and keeps the root store', () => {
    const disposed = vi.fn();
    const Local = defineSignal(() => 'local').extend((_, context) => {
      context.onDispose(() => disposed('local'));
    });
    const Global = defineSignal(() => 'global').extend((_, context) => {
      context.onDispose(() => disposed('global'));
    });
    const root = createRoot(() => Container.create({ owner: getOwner()! }));
    const { child, disposeChild } = createRoot((disposeChild) => ({
      child: Container.create({
        owner: getOwner()!,
        parent: root,
        provide: [Local],
      }),
      disposeChild,
    }));
    child.get(Local);
    const global = child.get(Global);

    disposeChild();

    expect(disposed).toHaveBeenCalledTimes(1);
    expect(disposed).toHaveBeenCalledWith('local');
    expect(root.get(Global)).toBe(global);
  });

  it('injects an unprovided store from the root into a provided store', () => {
    const Global = defineSignal(() => 'global');
    const Local = defineSignal(() => 'local').extend((_, context) => ({
      global: context.inject(Global),
    }));
    const { root, child } = chain({ provide: [Local] });

    expect(child.get(Local).global).toBe(root.get(Global));
  });

  it('throws the cycle error for an inject cycle across two containers', () => {
    const a: ReturnType<typeof defineSignal<number>> = defineSignal(
      () => 1,
    ).extend((_, context) => {
      context.inject(b);
    });
    const b: ReturnType<typeof defineSignal<number>> = defineSignal(
      () => 2,
    ).extend((_, context) => {
      context.inject(a);
    });
    const { child } = chain({ provide: [a] });

    expect(() => child.get(a)).toThrow(StateBuilderError);
    expect(() => child.get(a)).toThrow(/Circular dependency/);
  });
});
