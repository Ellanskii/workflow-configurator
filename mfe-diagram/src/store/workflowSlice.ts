import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import * as api from '../api/workflow';
import type { Step } from '../types';

export interface WorkflowState {
  steps: Step[];
  selectedStepId: number | null;
  status: 'idle' | 'loading' | 'error';
}

const initialState: WorkflowState = {
  steps: [],
  selectedStepId: null,
  status: 'idle',
};

export const fetchWorkflow = createAsyncThunk('workflow/fetch', async () => {
  return api.getWorkflow();
});

export const moveStep = createAsyncThunk(
  'workflow/moveStep',
  async ({ id, x, y }: { id: number; x: number; y: number }) => {
    await api.changeStepXY(id, x, y);
    return { id, x, y };
  },
);

const workflowSlice = createSlice({
  name: 'workflow',
  initialState,
  reducers: {
    stepSelected(state, action: PayloadAction<number | null>) {
      state.selectedStepId = action.payload;
    },
    stepMoved(
      state,
      action: PayloadAction<{ id: number; x: number; y: number }>,
    ) {
      const step = state.steps.find((s) => s.id === action.payload.id);
      if (step) {
        step.x = action.payload.x;
        step.y = action.payload.y;
      }
    },
    stepDeleted(state, action: PayloadAction<number>) {
      state.steps = state.steps
        .filter((s) => s.id !== action.payload)
        .map((s) => ({ ...s, transitions: s.transitions.filter((t) => t !== action.payload) }));
      if (state.selectedStepId === action.payload) {
        state.selectedStepId = null;
      }
    },
    stepCreated(state, action: PayloadAction<Step>) {
      state.steps.push(action.payload);
    },
    stepRenamed(state, action: PayloadAction<{ id: number; name: string }>) {
      const step = state.steps.find((s) => s.id === action.payload.id);
      if (step) step.name = action.payload.name;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkflow.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchWorkflow.fulfilled, (state, action) => {
        state.status = 'idle';
        state.steps = action.payload.steps;
      })
      .addCase(fetchWorkflow.rejected, (state) => {
        state.status = 'error';
      })
      .addCase(moveStep.fulfilled, (state, action) => {
        const step = state.steps.find((s) => s.id === action.payload.id);
        if (step) {
          step.x = action.payload.x;
          step.y = action.payload.y;
        }
      });
  },
});

export const { stepSelected, stepMoved, stepDeleted, stepCreated, stepRenamed } = workflowSlice.actions;
export default workflowSlice.reducer;
