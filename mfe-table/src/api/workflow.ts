import axios from 'axios';

import type { Step, Workflow } from '../types';

const WF_NAME = 'wf1';

const client = axios.create({
  baseURL: 'http://localhost:3000',
});

interface BackendStep {
  initialIndex: number;
  name: string;
  x: number;
  y: number;
  nextSteps: number[];
  color?: string;
}

function toStep(backendStep: BackendStep): Step {
  return {
    id: backendStep.initialIndex,
    name: backendStep.name,
    x: backendStep.x,
    y: backendStep.y,
    color: backendStep.color ?? '#ffffff',
    transitions: backendStep.nextSteps,
  };
}

function toWorkflow(backendSteps: BackendStep[], name: string): Workflow {
  const ids = new Set(backendSteps.map((s) => s.initialIndex));
  return {
    name,
    steps: backendSteps.map((s) => ({
      ...toStep(s),
      // переходы на удалённые шаги не показываем
      transitions: s.nextSteps.filter((id) => ids.has(id)),
    })),
  };
}

export async function getWorkflow(): Promise<Workflow> {
  const { data } = await client.get<BackendStep[] | { steps: BackendStep[] }>(
    '/workflow/get',
    { params: { wfName: WF_NAME } },
  );
  const steps = Array.isArray(data) ? data : data.steps;
  return toWorkflow(steps, WF_NAME);
}

export async function createStep(
  stepName: string,
  x: number,
  y: number,
  color?: string,
): Promise<Step> {
  const { data } = await client.post<BackendStep>('/workflow/createStep', {
    wfName: WF_NAME,
    stepName,
    x,
    y,
    color,
  });
  return toStep(data);
}

export async function deleteStep(stepInitialIndex: number): Promise<void> {
  await client.post('/workflow/deleteStep', {
    wfName: WF_NAME,
    stepInitialIndex,
  });
}

export async function changeStepName(
  stepInitialIndex: number,
  stepName: string,
): Promise<void> {
  await client.post('/workflow/changeStepName', {
    wfName: WF_NAME,
    stepInitialIndex,
    stepName,
  });
}

export async function changeStepXY(
  stepInitialIndex: number,
  x: number,
  y: number,
): Promise<void> {
  await client.post('/workflow/changeStepXY', {
    wfName: WF_NAME,
    stepInitialIndex,
    x,
    y,
  });
}
