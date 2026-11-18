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
        store.set((state) => {
          state.background = background;
        });
      },
      setOpacity(opacity: number) {
        store.set((state) => {
          state.opacity = opacity;
        });
      },
      setPadding(padding: number) {
        store.set((state) => {
          state.padding = padding;
        });
      },
      setRadius(radius: number) {
        store.set((state) => {
          state.radius = radius;
        });
      },
      setScale(scale: number) {
        store.set((state) => {
          state.scale = scale;
        });
      },
      setAutoWidth(autoWidth: boolean) {
        store.set((state) => {
          state.autoWidth = autoWidth;
        });
      },
      setWidth(width: number) {
        store.set((state) => {
          state.width = width;
        });
      },
      setHeight(height: number) {
        store.set((state) => {
          state.height = height;
        });
      },
      setVisibility(visible: boolean) {
        store.set((state) => {
          state.visible = visible;
        });
      },
      toggleVisibility() {
        store.set((state) => {
          state.visible = !state.visible;
        });
      },
      setNextPadding() {
        const availablePadding = appEnvironment.editorPadding;
        const currentIndex = availablePadding.findIndex(
          (item) => Number(item.value) === store.peek().padding,
        );
        const next = (currentIndex + 1) % availablePadding.length;
        store.set((state) => {
          state.padding = Number(availablePadding[next].value);
        });
      },
      setFromPreset(presetData: PresetFrameData) {
        store.set((state) => {
          Object.assign(state, {
            ...presetData,
            signature: parseSignature(presetData.signature),
            aspectRatio: presetData.aspectRatio ?? null,
            exportTarget: presetData.exportTarget ?? null,
          });
        });
      },
      setFromPersistedState(persisted: PersistedFrameState) {
        store.set((state) => {
          Object.assign(state, {
            ...persisted,
            signature: parseSignature(persisted.signature),
            aspectRatio: persisted.aspectRatio ?? null,
            exportTarget: persisted.exportTarget ?? null,
          });
        });
      },
      setSignature(signature: FrameState['signature']) {
        store.set((state) => {
          state.signature = signature;
        });
      },
      setAspectRatio(aspectRatio: string | null) {
        store.set((state) => {
          Object.assign(state, { aspectRatio, exportTarget: null });
        });
      },
      setExportTarget(exportTarget: FrameState['exportTarget']) {
        store.set((state) => {
          Object.assign(state, { exportTarget, aspectRatio: null });
        });
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
          listener(mapToStateToPersistState(store.peek())),
        );
      },
      stateToPersist() {
        return mapToStateToPersistState(store.peek());
      },
      ...store.actions,
    };
  });
