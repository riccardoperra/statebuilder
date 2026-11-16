import { describe, expectTypeOf, it } from 'vitest';
import { Container } from '../src';
import {
  FrameStore,
  type FrameState,
  type PresetFrameData,
} from './fixtures/frame.store';
import {
  EditorStore,
  PanelEditorStore,
  type WorkflowStep,
} from './fixtures/panel-editor.store';

describe('ported stores keep precise types', () => {
  it('frame store', () => {
    const frame = Container.create().get(FrameStore);

    expectTypeOf(frame.store).toEqualTypeOf<FrameState>();
    expectTypeOf(frame.setFromPreset).parameters.toEqualTypeOf<
      [presetData: PresetFrameData]
    >();
    expectTypeOf(frame.actions.setPadding.silent).parameters.toEqualTypeOf<
      [padding: number]
    >();
    frame.onAction('setExportTarget', ({ args }) =>
      expectTypeOf(args).toEqualTypeOf<
        [exportTarget: FrameState['exportTarget']]
      >(),
    );
  });

  it('panel editor store', () => {
    const container = Container.create();
    const panel = container.get(PanelEditorStore);
    const editor = container.get(EditorStore);

    expectTypeOf(panel.selectedStep()).toEqualTypeOf<WorkflowStep | null>();
    expectTypeOf(panel.headerPanelLabel()).toEqualTypeOf<string>();
    editor.onAction('setSelectedJobId', ({ args }) =>
      expectTypeOf(args).toEqualTypeOf<[id: string | null]>(),
    );
  });
});
