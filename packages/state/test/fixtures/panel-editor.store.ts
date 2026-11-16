import { createMemo } from 'solid-js';
import { defineStore } from '../../src';
import { withActions } from '../../src/plugins/actions';

export interface WorkflowStep {
  $nodeId: string;
  id: string;
  name?: string;
}

export interface WorkflowJob {
  $nodeId: string;
  id: string;
  name: string;
  steps: WorkflowStep[];
}

interface EditorState {
  selectedJobId: string | null;
  jobs: WorkflowJob[];
}

export const EditorStore = defineStore<EditorState>(() => ({
  selectedJobId: null,
  jobs: [],
}))
  .extend((_) => ({
    selectedJob: (): WorkflowJob | undefined =>
      _.get.jobs.find((job) => job.$nodeId === _.get.selectedJobId),
  }))
  .extend(
    withActions((_) => ({
      setSelectedJobId(id: string | null) {
        _.set('selectedJobId', id);
      },
    })),
  );

export interface PanelEditorState {
  activeStep: string | null;
}

export const PanelEditorStore = defineStore<PanelEditorState>(() => ({
  activeStep: null,
}))
  .extend(
    withActions((_) => ({
      setActiveStepId(id: string | null) {
        _.set('activeStep', id);
      },
    })),
  )
  .extend((_, context) => {
    const editorStore = context.inject(EditorStore);

    editorStore.onAction(
      'setSelectedJobId',
      () => _.actions.setActiveStepId(null),
      { phase: 'before' },
    );

    const selectedStep = createMemo(() => {
      const activeStep = _.get.activeStep;
      if (activeStep === null) {
        return null;
      }
      return editorStore
        .selectedJob()!
        .steps.find((step) => step.$nodeId === activeStep)!;
    });

    return {
      back() {
        if (_.get.activeStep) {
          _.actions.setActiveStepId(null);
        } else {
          editorStore.actions.setSelectedJobId(null);
        }
      },
      selectedJob: editorStore.selectedJob,
      deselectJob() {
        editorStore.actions.setSelectedJobId(null);
      },
      selectedStep,
      headerPanelLabel: () => {
        const selectedJob = editorStore.selectedJob()!;
        const activeStep = selectedStep();
        const jobName = `${selectedJob.name || selectedJob.id}`;
        if (activeStep === null) {
          return jobName;
        }
        return `${jobName} / ${activeStep.name ?? activeStep.id}`;
      },
    };
  });
