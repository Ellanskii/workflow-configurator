import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../api/workflow';
import type { Step } from '../types';
import { useWorkflowStore } from './workflow';

vi.mock('../api/workflow');

function makeStep(overrides: Partial<Step> = {}): Step {
  return {
    id: 0,
    name: 'Шаг 1',
    x: 0,
    y: 0,
    color: '#ffffff',
    transitions: [],
    ...overrides,
  };
}

describe('workflow store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('createStep uses provided name and transitions', async () => {
    const store = useWorkflowStore();
    store.steps = [makeStep({ id: 0, name: 'Шаг 1' })];

    vi.mocked(api.createStep).mockResolvedValue(
      makeStep({ id: 1, name: 'Шаг 2', transitions: [0] }),
    );

    const step = await store.createStep('Шаг 2', [0]);

    expect(api.createStep).toHaveBeenCalledWith('Шаг 2', 0, 0, '#333333', [0]);
    expect(step?.name).toBe('Шаг 2');
    expect(store.steps).toHaveLength(2);
  });

  it('renameStep rejects duplicate names (case-insensitive)', async () => {
    const store = useWorkflowStore();
    store.steps = [
      makeStep({ id: 0, name: 'Закупка' }),
      makeStep({ id: 1, name: 'Доставка' }),
    ];

    const ok = await store.renameStep(1, 'закупка');

    expect(ok).toBe(false);
    expect(api.changeStepName).not.toHaveBeenCalled();
  });

  it('deleteStep removes the step and dangling transitions to it', async () => {
    const store = useWorkflowStore();
    store.steps = [
      makeStep({ id: 0, name: 'A', transitions: [1] }),
      makeStep({ id: 1, name: 'B' }),
    ];
    vi.mocked(api.deleteStep).mockResolvedValue(undefined);

    await store.deleteStep(1);

    expect(store.steps).toHaveLength(1);
    expect(store.steps[0].transitions).toEqual([]);
  });
});
