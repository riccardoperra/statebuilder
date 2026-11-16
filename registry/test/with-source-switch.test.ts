import { describe, expect, it, vi } from 'vitest';
import { createRoot, createSignal } from 'solid-js';
import { Container, defineSignal, defineStore } from 'statebuilder';
import { withSourceSwitch, type Source } from '../src/with-source-switch';

interface Preset {
  name: string;
}

function memorySource(initial: Preset[]) {
  let saved = initial;
  return {
    load: vi.fn(async () => saved),
    save: vi.fn(async (value: Preset[]) => {
      saved = value;
    }),
    get saved() {
      return saved;
    },
  } satisfies Source<Preset[]> & { saved: Preset[] };
}

function setup() {
  const [loggedIn, setLoggedIn] = createSignal(false);
  const local = memorySource([{ name: 'local' }]);
  const remote = memorySource([{ name: 'remote' }]);
  const definition = defineStore((): Preset[] => []).extend(
    withSourceSwitch({ useRemote: loggedIn, local, remote }),
  );
  const presets = createRoot(() => Container.create().get(definition));
  return { presets, local, remote, setLoggedIn };
}

describe('withSourceSwitch', () => {
  it('reads useRemote when load is called', async () => {
    const { presets, setLoggedIn } = setup();

    await presets.source.load();
    expect(presets()).toEqual([{ name: 'local' }]);

    setLoggedIn(true);
    await presets.source.load();
    expect(presets()).toEqual([{ name: 'remote' }]);
  });

  it('saves to the source that is current when save is called', async () => {
    const { presets, local, remote, setLoggedIn } = setup();
    presets.set([{ name: 'mine' }]);

    await presets.source.save();
    setLoggedIn(true);
    await presets.source.save();

    expect(local.save).toHaveBeenCalledTimes(1);
    expect(remote.save).toHaveBeenCalledTimes(1);
    expect(remote.saved).toEqual([{ name: 'mine' }]);
  });

  it('saves a plain copy that later writes do not change', async () => {
    const { presets, local } = setup();
    presets.set([{ name: 'mine' }]);

    await presets.source.save();
    presets.set(0, 'name', 'changed');

    expect(local.saved).toEqual([{ name: 'mine' }]);
  });

  it('current names the active source', () => {
    const { presets, setLoggedIn } = setup();

    expect(presets.source.current()).toBe('local');
    setLoggedIn(true);
    expect(presets.source.current()).toBe('remote');
  });

  it('load replaces the state, removing keys the loaded value lacks', async () => {
    const definition = defineStore((): { theme: string; draft?: string } => ({
      theme: 'light',
      draft: 'x',
    })).extend(
      withSourceSwitch({
        useRemote: () => false,
        local: { load: () => ({ theme: 'dark' }), save: () => {} },
        remote: { load: () => ({ theme: 'remote' }), save: () => {} },
      }),
    );
    const settings = createRoot(() => Container.create().get(definition));

    await settings.source.load();

    expect(settings()).toEqual({ theme: 'dark' });
  });

  it('works with a signal', async () => {
    const definition = defineSignal(() => 'light').extend(
      withSourceSwitch({
        useRemote: () => false,
        local: { load: () => 'dark', save: () => {} },
        remote: { load: async () => 'remote', save: async () => {} },
      }),
    );
    const theme = createRoot(() => Container.create().get(definition));

    await theme.source.load();

    expect(theme()).toBe('dark');
  });
});
