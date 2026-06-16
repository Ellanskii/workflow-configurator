import { defineStore } from 'pinia';

import * as api from '../api/workflow';
import { emitStepDeleted, emitStepSelected } from '../events';
import type { SortColumn, SortDirection, Step } from '../types';

const SORT_STORAGE_KEY = 'workflow_sort';

function loadSort(): { sortColumn: SortColumn | null; sortDirection: SortDirection } {
  try {
    const raw = localStorage.getItem(SORT_STORAGE_KEY);
    if (!raw) return { sortColumn: null, sortDirection: 'asc' };
    const parsed = JSON.parse(raw);
    return {
      sortColumn: parsed.column ?? null,
      sortDirection: parsed.direction === 'desc' ? 'desc' : 'asc',
    };
  } catch {
    return { sortColumn: null, sortDirection: 'asc' };
  }
}

interface WorkflowState {
  steps: Step[];
  selectedStepId: number | null;
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  searchQuery: string;
  sortColumn: SortColumn | null;
  sortDirection: SortDirection;
}

export const useWorkflowStore = defineStore('workflow', {
  state: (): WorkflowState => ({
    steps: [],
    selectedStepId: null,
    isLoading: false,
    isMutating: false,
    error: null,
    searchQuery: '',
    ...loadSort(),
  }),

  getters: {
    stepById: (state) => (id: number) =>
      state.steps.find((s) => s.id === id),

    filteredSteps(state): Step[] {
      const query = state.searchQuery.trim().toLowerCase();
      if (!query) return state.steps;
      return state.steps.filter((s) => s.name.toLowerCase().includes(query));
    },

    sortedSteps(): Step[] {
      const items = [...this.filteredSteps];
      const { sortColumn, sortDirection } = this;
      if (!sortColumn) return items;

      const dir = sortDirection === 'asc' ? 1 : -1;
      return items.sort((a, b) => {
        let result = 0;
        switch (sortColumn) {
          case 'name':
            result = a.name.localeCompare(b.name, 'ru');
            break;
          case 'x':
            result = a.x - b.x;
            break;
          case 'y':
            result = a.y - b.y;
            break;
          case 'transitions':
            result = a.transitions.length - b.transitions.length;
            break;
        }
        return result * dir;
      });
    },
  },

  actions: {
    async fetchWorkflow() {
      this.isLoading = true;
      this.error = null;
      try {
        const workflow = await api.getWorkflow();
        this.steps = workflow.steps;
      } catch {
        this.error = 'Не удалось загрузить данные процесса';
      } finally {
        this.isLoading = false;
      }
    },

    isNameTaken(name: string, excludeId?: number): boolean {
      const normalized = name.trim().toLowerCase();
      return this.steps.some(
        (s) => s.id !== excludeId && s.name.toLowerCase() === normalized,
      );
    },

    generateDefaultName(): string {
      let n = this.steps.length + 1;
      let name = `Шаг ${n}`;
      while (this.isNameTaken(name)) {
        n += 1;
        name = `Шаг ${n}`;
      }
      return name;
    },

    async createStep(): Promise<Step | null> {
      this.isMutating = true;
      this.error = null;
      try {
        const name = this.generateDefaultName();
        const step = await api.createStep(name, 0, 0, '#333333');
        this.steps.push(step);
        return step;
      } catch {
        this.error = 'Не удалось создать шаг';
        return null;
      } finally {
        this.isMutating = false;
      }
    },

    async deleteStep(id: number) {
      this.isMutating = true;
      this.error = null;
      try {
        await api.deleteStep(id);
        this.steps = this.steps
          .filter((s) => s.id !== id)
          .map((s) => ({
            ...s,
            transitions: s.transitions.filter((t) => t !== id),
          }));
        if (this.selectedStepId === id) {
          this.selectStep(null);
        }
        emitStepDeleted(id);
      } catch {
        this.error = 'Не удалось удалить шаг';
      } finally {
        this.isMutating = false;
      }
    },

    async renameStep(id: number, name: string): Promise<boolean> {
      const trimmed = name.trim();
      if (!trimmed) return false;
      if (this.isNameTaken(trimmed, id)) return false;

      this.isMutating = true;
      this.error = null;
      try {
        await api.changeStepName(id, trimmed);
        const step = this.steps.find((s) => s.id === id);
        if (step) step.name = trimmed;
        return true;
      } catch {
        this.error = 'Не удалось переименовать шаг';
        return false;
      } finally {
        this.isMutating = false;
      }
    },

    async moveStep(id: number, x: number, y: number) {
      const step = this.steps.find((s) => s.id === id);
      if (step) {
        step.x = x;
        step.y = y;
      }
      try {
        await api.changeStepXY(id, x, y);
      } catch {
        this.error = 'Не удалось сохранить координаты шага';
      }
    },

    moveStepFromEvent(id: number, x: number, y: number) {
      const step = this.steps.find((s) => s.id === id);
      if (step) {
        step.x = x;
        step.y = y;
      }
    },

    selectStep(id: number | null) {
      this.selectedStepId = id;
      emitStepSelected(id);
    },

    setSelectedFromEvent(id: number | null) {
      this.selectedStepId = id;
    },

    setSearchQuery(query: string) {
      this.searchQuery = query;
    },

    setSort(column: SortColumn) {
      if (this.sortColumn === column) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortColumn = column;
        this.sortDirection = 'asc';
      }
      localStorage.setItem(
        SORT_STORAGE_KEY,
        JSON.stringify({ column: this.sortColumn, direction: this.sortDirection }),
      );
    },
  },
});
