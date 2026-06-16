import { describe, expect, it } from 'vitest';

import reducer, { stepMoved, stepSelected, type WorkflowState } from './workflowSlice';

function initialState(): WorkflowState {
  return {
    steps: [
      { id: 1, name: 'Закупка', x: 10, y: 20, color: '#666666', transitions: [] },
    ],
    selectedStepId: null,
    status: 'idle',
  };
}

describe('workflowSlice', () => {
  it('stepSelected updates selectedStepId', () => {
    const state = reducer(initialState(), stepSelected(1));
    expect(state.selectedStepId).toBe(1);
  });

  it('stepSelected(null) clears selection', () => {
    const state = reducer({ ...initialState(), selectedStepId: 1 }, stepSelected(null));
    expect(state.selectedStepId).toBeNull();
  });

  it('stepMoved updates step coordinates', () => {
    const state = reducer(initialState(), stepMoved({ id: 1, x: 100, y: 200 }));
    expect(state.steps[0]).toMatchObject({ x: 100, y: 200 });
  });
});
