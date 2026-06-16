import { configureStore } from '@reduxjs/toolkit';

import workflowReducer from './workflowSlice';

export function createStore() {
  return configureStore({
    reducer: {
      workflow: workflowReducer,
    },
  });
}

export type AppStore = ReturnType<typeof createStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
