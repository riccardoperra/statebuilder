import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import { createRoot } from 'solid-js';
import { Container, defineSignal, defineStore } from 'statebuilder';
import { withPersist, type PersistStorage } from '../src/with-persist';

const flush = () => new Promise((resolve) => setTimeout(resolve));

function asyncStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: vi.fn(async (key: string) => data.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      data.set(key, value);
    }),
    removeItem: vi.fn(async (key: string) => {
      data.delete(key);
    }),
  } satisfies PersistStorage & { data: Map<string, string> };
}

const SettingsStore = (storage: PersistStorage) =>
  defineStore(() => ({ theme: 'light', fontSize: 14 })).extend(
    withPersist({ key: 'settings', storage }),
  );

const resolve = <T>(fn: () => T) => createRoot(fn);

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('withPersist', () => {
  it('hydrates synchronously from a sync storage and saves each write', () => {
    localStorage.setItem('settings', JSON.stringify({ theme: 'dark' }));
    const definition = SettingsStore(localStorage);
    const settings = resolve(() => Container.create().get(definition));

    expect(settings.persist.hydrated()).toBe(true);
    expect(settings()).toEqual({ theme: 'dark', fontSize: 14 });

    settings.set('fontSize', 16);

    expect(JSON.parse(localStorage.getItem('settings')!)).toEqual({
      theme: 'dark',
      fontSize: 16,
    });
  });

  it('hydrates from an async storage once it answers', async () => {
    const storage = asyncStorage({ settings: '{"theme":"dark"}' });
    const definition = SettingsStore(storage);
    const settings = resolve(() => Container.create().get(definition));

    expect(settings.persist.hydrated()).toBe(false);
    expect(settings().theme).toBe('light');
    await flush();

    expect(settings.persist.hydrated()).toBe(true);
    expect(settings()).toEqual({ theme: 'dark', fontSize: 14 });
  });

  it('does not write the hydrated value back to the storage', async () => {
    const storage = asyncStorage({ settings: '{"theme":"dark"}' });
    const definition = SettingsStore(storage);
    resolve(() => Container.create().get(definition));
    await flush();

    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('keeps the initial state when the stored value fails to deserialize', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem('settings', '{not json');
    const definition = SettingsStore(localStorage);

    const settings = resolve(() => Container.create().get(definition));

    expect(settings()).toEqual({ theme: 'light', fontSize: 14 });
    expect(settings.persist.hydrated()).toBe(true);
    expect(warn).toHaveBeenCalled();
  });

  it('keeps the initial state when the async storage rejects', async () => {
    const storage = asyncStorage();
    storage.getItem.mockRejectedValueOnce(new Error('blocked'));
    const definition = SettingsStore(storage);
    const settings = resolve(() => Container.create().get(definition));
    await flush();

    expect(settings()).toEqual({ theme: 'light', fontSize: 14 });
    expect(settings.persist.hydrated()).toBe(true);
  });

  it('saves only what select picks and merges it into the initial state', () => {
    localStorage.setItem('settings', '{"theme":"dark"}');
    const definition = defineStore(() => ({
      theme: 'light',
      draft: '',
    })).extend(
      withPersist({
        key: 'settings',
        storage: localStorage,
        select: (state) => {
          expectTypeOf(state).toEqualTypeOf<{ theme: string; draft: string }>();
          return { theme: state.theme };
        },
      }),
    );
    const settings = resolve(() => Container.create().get(definition));

    settings.set('draft', 'hello');

    expect(settings()).toEqual({ theme: 'dark', draft: 'hello' });
    expect(localStorage.getItem('settings')).toBe('{"theme":"dark"}');
  });

  it('uses custom serialize and deserialize', () => {
    localStorage.setItem('count', '41');
    const definition = defineSignal(() => 0).extend(
      withPersist({
        key: 'count',
        storage: localStorage,
        serialize: (value) => value.toFixed(),
        deserialize: Number,
      }),
    );
    const count = resolve(() => Container.create().get(definition));

    expect(count()).toBe(41);
    count.set(42);
    expect(localStorage.getItem('count')).toBe('42');
  });

  it('clear removes the stored value', async () => {
    const definition = SettingsStore(localStorage);
    const settings = resolve(() => Container.create().get(definition));
    settings.set('theme', 'dark');

    await settings.persist.clear();

    expect(localStorage.getItem('settings')).toBeNull();
  });
});
