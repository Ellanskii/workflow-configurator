/** Шаг рабочего процесса. */
export interface Step {
  id: number;
  name: string;
  x: number;
  y: number;
  color: string;
  /** id шагов, в которые есть переход из этого шага */
  transitions: number[];
}

export interface Workflow {
  name: string;
  steps: Step[];
}

export type SortColumn = 'name' | 'x' | 'y' | 'transitions';
export type SortDirection = 'asc' | 'desc';

export interface SortState {
  column: SortColumn | null;
  direction: SortDirection;
}
