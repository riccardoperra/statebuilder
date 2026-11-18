import { describe, expect, it } from 'vitest';
import { createRoot, flush } from 'solid-js';
import { Container } from '../src';
import { FrameStore, type PersistedFrameState } from './fixtures/frame.store';
import { EditorStore, PanelEditorStore } from './fixtures/panel-editor.store';

describe('frame store port', () => {
  const resolveFrame = () =>
    createRoot(() => Container.create().get(FrameStore));

  it('runs the ported actions, also spread on the store', () => {
    const frame = resolveFrame();

    frame.actions.setPadding(32);
    frame.toggleVisibility();
    frame.setNextPadding();
    frame.setExportTarget('x-post');
    flush();

    expect(frame.store.padding).toBe(64);
    expect(frame.store.visible).toBe(false);
    expect(frame.exportTarget()).toEqual({ id: 'x-post', kind: 'target' });
    expect(frame.exportPixelRatio(2)).toBe(1);

    frame.setAspectRatio('16/9');
    flush();
    expect(frame.store.exportTarget).toBeNull();
    expect(frame.exportPixelRatio(2)).toBe(2);
  });

  it('applies a preset and parses its signature', () => {
    const frame = resolveFrame();

    frame.setFromPreset({
      background: '#000',
      padding: 16,
      radius: 0,
      visible: true,
      opacity: 50,
      signature: { handle: '@me' },
    });

    expect(frame.stateToPersist()).toEqual({
      background: '#000',
      padding: 16,
      radius: 0,
      visible: true,
      opacity: 50,
      signature: { handle: '@me' },
      aspectRatio: null,
      exportTarget: null,
    });
  });

  it('reports the state to persist only for the persisted actions', () => {
    const frame = resolveFrame();
    const persisted: PersistedFrameState[] = [];
    frame.onStateToPersist((state) => persisted.push(state));

    frame.setPadding(16);
    frame.setWidth(300);
    frame.toggleVisibility();
    frame.setFromPersistedState({ ...frame.stateToPersist(), radius: 2 });
    frame.setRadius(4);

    expect(persisted.map((state) => [state.padding, state.radius])).toEqual([
      [16, 8],
      [16, 4],
    ]);
  });
});

describe('panel editor store port', () => {
  const jobs = [
    {
      $nodeId: 'job-1',
      id: 'build',
      name: 'Build',
      steps: [{ $nodeId: 'step-1', id: 'checkout', name: 'Checkout' }],
    },
    { $nodeId: 'job-2', id: 'test', name: '', steps: [] },
  ];

  function setup() {
    const setup = createRoot((disposeAll) => {
      const root = Container.create();
      const editor = root.get(EditorStore);
      const panel = createRoot((disposePanel) => ({
        store: Container.create({
          parent: root,
          provide: [PanelEditorStore],
        }).get(PanelEditorStore),
        disposePanel,
      }));
      return { editor, ...panel, disposeAll };
    });
    setup.editor.set((state) => {
      state.jobs = jobs;
    });
    flush();
    return setup;
  }

  it('resets the active step when the editor selects another job', () => {
    const { editor, store: panel } = setup();
    editor.actions.setSelectedJobId('job-1');
    panel.actions.setActiveStepId('step-1');
    flush();

    expect(panel.headerPanelLabel()).toBe('Build / Checkout');

    editor.actions.setSelectedJobId('job-2');
    flush();

    expect(panel().activeStep).toBeNull();
    expect(panel.headerPanelLabel()).toBe('test');
  });

  it('goes back from a step to the job, then deselects the job', () => {
    const { editor, store: panel } = setup();
    editor.actions.setSelectedJobId('job-1');
    panel.actions.setActiveStepId('step-1');
    flush();

    panel.back();
    flush();
    expect(panel.selectedStep()).toBeNull();
    expect(editor().selectedJobId).toBe('job-1');

    panel.back();
    flush();
    expect(editor().selectedJobId).toBeNull();
    expect(panel.selectedJob()).toBeUndefined();
  });

  it('stops listening to the editor once the panel store is disposed', () => {
    const { editor, store: panel, disposePanel } = setup();
    editor.actions.setSelectedJobId('job-1');
    panel.actions.setActiveStepId('step-1');
    flush();

    disposePanel();
    editor.actions.setSelectedJobId('job-2');
    flush();

    expect(panel().activeStep).toBe('step-1');
  });
});
