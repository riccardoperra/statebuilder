import { createMemo } from 'solid-js';
import { defineStore } from '../../src';
import { withActions } from '../../src/plugins/actions';

type ExportTargetId = 'instagram-post' | 'x-post';

interface FrameSignature {
  handle: string;
}

export interface FrameState {
  background: string | null;
  padding: number;
  radius: number;
  visible: boolean;
  opacity: number;
  autoWidth: boolean;
  scale: number;
  width: number;
  height: number;
  signature: FrameSignature | null;
  aspectRatio: string | null;
  exportTarget: ExportTargetId | null;
}

export type PersistedFrameState = Pick<
  FrameState,
  | 'background'
  | 'padding'
  | 'radius'
  | 'visible'
  | 'opacity'
  | 'signature'
  | 'aspectRatio'
  | 'exportTarget'
>;

export type PresetFrameData = Omit<
  PersistedFrameState,
  'signature' | 'aspectRatio' | 'exportTarget'
> & {
  signature?: unknown;
  aspectRatio?: string | null;
  exportTarget?: ExportTargetId | null;
};

const appEnvironment = {
  editorPadding: [{ value: '16' }, { value: '32' }, { value: '64' }],
};

function parseSignature(value: unknown): FrameSignature | null {
  if (!value || typeof value !== 'object') return null;
  const handle = (value as Record<string, unknown>).handle;
  return typeof handle === 'string' && handle ? { handle } : null;
}

function getExportTarget(id: ExportTargetId | null) {
  return id ? { id, kind: 'target' as const } : undefined;
}

export function getInitialFrameState(): FrameState {
  return {
    background: null,
    padding: 64,
    radius: 8,
    visible: true,
    opacity: 100,
    autoWidth: false,
    scale: 1,
    width: 0,
    height: 0,
    aspectRatio: null,
    exportTarget: null,
    signature: null,
  };
}

const persistedActions = [
  'setBackground',
  'setOpacity',
  'setPadding',
  'setRadius',
  'setScale',
  'setAutoWidth',
  'setVisibility',
  'setNextPadding',
  'setFromPreset',
  'setSignature',
  'setAspectRatio',
  'setExportTarget',
] as const;

export const FrameStore = defineStore(() => getInitialFrameState())
  .extend(
    withActions((store) => ({
      setBackground(background: string) {
        store.set('background', background);
      },
      setOpacity(opacity: number) {
        store.set('opacity', opacity);
      },
      setPadding(padding: number) {
        store.set('padding', padding);
      },
      setRadius(radius: number) {
        store.set('radius', radius);
      },
      setScale(scale: number) {
        store.set('scale', scale);
      },
      setAutoWidth(autoWidth: boolean) {
        store.set('autoWidth', autoWidth);
      },
      setWidth(width: number) {
        store.set('width', width);
      },
      setHeight(height: number) {
        store.set('height', height);
      },
      setVisibility(visible: boolean) {
        store.set('visible', visible);
      },
      toggleVisibility() {
        store.set('visible', (visible) => !visible);
      },
      setNextPadding() {
        const availablePadding = appEnvironment.editorPadding;
        const currentIndex = availablePadding.findIndex(
          (item) => Number(item.value) === store.get.padding,
        );
        const next = (currentIndex + 1) % availablePadding.length;
        store.set('padding', Number(availablePadding[next].value));
      },
      setFromPreset(presetData: PresetFrameData) {
        store.set({
          ...presetData,
          signature: parseSignature(presetData.signature),
          aspectRatio: presetData.aspectRatio ?? null,
          exportTarget: presetData.exportTarget ?? null,
        });
      },
      setFromPersistedState(persisted: PersistedFrameState) {
        store.set({
          ...persisted,
          signature: parseSignature(persisted.signature),
          aspectRatio: persisted.aspectRatio ?? null,
          exportTarget: persisted.exportTarget ?? null,
        });
      },
      setSignature(signature: FrameState['signature']) {
        store.set('signature', signature);
      },
      setAspectRatio(aspectRatio: string | null) {
        store.set({ aspectRatio, exportTarget: null });
      },
      setExportTarget(exportTarget: FrameState['exportTarget']) {
        store.set({ exportTarget, aspectRatio: null });
      },
    })),
  )
  .extend((store) => {
    const exportTarget = createMemo(() =>
      getExportTarget(store().exportTarget),
    );
    const exportPixelRatio = (pixelRatio: number) =>
      exportTarget() ? 1 : pixelRatio;
    const mapToStateToPersistState = (
      state: FrameState,
    ): PersistedFrameState => ({
      background: state.background,
      opacity: state.opacity,
      padding: state.padding,
      visible: state.visible,
      radius: state.radius,
      signature: state.signature,
      aspectRatio: state.aspectRatio,
      exportTarget: state.exportTarget,
    });

    return {
      get store() {
        return store.get;
      },
      exportTarget,
      exportPixelRatio,
      setStore: store.set,
      onStateToPersist(listener: (state: PersistedFrameState) => void) {
        return store.onAction(persistedActions, () =>
          listener(mapToStateToPersistState(store())),
        );
      },
      stateToPersist() {
        return mapToStateToPersistState(store());
      },
      ...store.actions,
    };
  });
