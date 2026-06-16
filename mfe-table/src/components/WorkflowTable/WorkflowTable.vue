<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';

import Modal from '../Modal/Modal.vue';
import { onStepMoved, onStepSelected } from '../../events';
import { useWorkflowStore } from '../../stores/workflow';
import type { SortColumn, Step } from '../../types';
import styles from './WorkflowTable.module.scss';

const store = useWorkflowStore();

const editingId = ref<number | null>(null);
const editingName = ref('');
const editingError = ref('');
const editInputRef = ref<HTMLInputElement | null>(null);

const pendingDeleteId = ref<number | null>(null);

const newStepRowRef = ref<HTMLTableRowElement | null>(null);
let lastCreatedId: number | null = null;

const showCreateModal = ref(false);
const createName = ref('');
const createColor = ref('#333333');
const createTransitions = ref<number[]>([]);
const createError = ref('');
const createNameInputRef = ref<HTMLInputElement | null>(null);

const unsubscribers: (() => void)[] = [];

onMounted(async () => {
  await store.fetchWorkflow();
  unsubscribers.push(onStepSelected((id) => {
    store.setSelectedFromEvent(id);
  }));
  unsubscribers.push(onStepMoved((id, x, y) => {
    store.moveStepFromEvent(id, x, y);
  }));
});

onUnmounted(() => {
  unsubscribers.forEach((fn) => fn());
});

const columns: { key: SortColumn; label: string }[] = [
  { key: 'name', label: 'Состояние' },
  { key: 'x', label: 'x' },
  { key: 'y', label: 'y' },
  { key: 'transitions', label: 'Переходы' },
];

const steps = computed(() => store.sortedSteps);

function stepName(id: number): string {
  return store.stepById(id)?.name ?? `#${id}`;
}

function stepColor(id: number): string {
  return store.stepById(id)?.color ?? '#333333';
}

function onRowClick(step: Step) {
  if (editingId.value === step.id) return;
  store.selectStep(step.id);
}

function onSortClick(column: SortColumn) {
  store.setSort(column);
}

function sortIndicator(column: SortColumn): string {
  if (store.sortColumn !== column) return '';
  return store.sortDirection === 'asc' ? '▲' : '▼';
}

async function startEdit(step: Step) {
  editingId.value = step.id;
  editingName.value = step.name;
  editingError.value = '';
  await nextTick();
  editInputRef.value?.focus();
  editInputRef.value?.select();
}

async function commitEdit() {
  if (editingId.value === null) return;
  const id = editingId.value;
  const name = editingName.value.trim();

  if (!name) {
    editingError.value = 'Название не может быть пустым';
    return;
  }
  if (store.isNameTaken(name, id)) {
    editingError.value = 'Такое название уже используется';
    return;
  }

  const ok = await store.renameStep(id, name);
  if (ok) {
    editingId.value = null;
    editingError.value = '';
  } else {
    editingError.value = store.error ?? 'Не удалось сохранить';
  }
}

function cancelEdit() {
  editingId.value = null;
  editingError.value = '';
}

async function onCreateClick() {
  createName.value = store.generateDefaultName();
  createColor.value = '#ffffff';
  createTransitions.value = [];
  createError.value = '';
  showCreateModal.value = true;
  await nextTick();
  createNameInputRef.value?.focus();
  createNameInputRef.value?.select();
}

function closeCreateModal() {
  showCreateModal.value = false;
}

async function submitCreate() {
  const name = createName.value.trim();
  if (!name) {
    createError.value = 'Название не может быть пустым';
    return;
  }
  if (store.isNameTaken(name)) {
    createError.value = 'Такое название уже используется';
    return;
  }
  const step = await store.createStep(name, createTransitions.value, createColor.value);
  if (step) {
    showCreateModal.value = false;
    lastCreatedId = step.id;
    await nextTick();
    await nextTick();
    if (newStepRowRef.value) {
      newStepRowRef.value.scrollIntoView({ block: 'nearest' });
    }
  } else {
    createError.value = store.error ?? 'Не удалось создать шаг';
  }
}

function requestDelete(id: number) {
  pendingDeleteId.value = id;
}

function cancelDelete() {
  pendingDeleteId.value = null;
}

async function confirmDelete() {
  if (pendingDeleteId.value === null) return;
  await store.deleteStep(pendingDeleteId.value);
  pendingDeleteId.value = null;
}

const deleteStepName = computed(() =>
  pendingDeleteId.value !== null ? stepName(pendingDeleteId.value) : '',
);

function onSearchInput(e: Event) {
  store.setSearchQuery((e.target as HTMLInputElement).value);
}
</script>

<template>
  <div :class="styles.workflow">
    <div :class="styles.workflow__header">
      <h1 :class="styles.workflow__title">Структура рабочего процесса</h1>
      <button
        type="button"
        :class="styles.workflow__createBtn"
        :disabled="store.isMutating"
        @click="onCreateClick"
      >
        <i class="fa-solid fa-plus"></i>
        Создать состояние
      </button>
    </div>

    <div :class="styles.workflow__search">
      <i class="fa-solid fa-magnifying-glass" :class="styles.workflow__searchIcon"></i>
      <input
        type="text"
        placeholder="Поиск по названию"
        :class="styles.workflow__searchInput"
        :value="store.searchQuery"
        @input="onSearchInput"
      />
    </div>

    <div v-if="store.error" :class="styles.workflow__toast">
      {{ store.error }}
    </div>

    <div :class="styles.workflow__tableWrap" @click="store.selectStep(null)">
      <table :class="styles.workflow__table">
        <thead :class="styles.workflow__thead">
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              :class="styles.workflow__th"
              @click="onSortClick(col.key)"
            >
              {{ col.label }}
              <span :class="styles.workflow__sortIndicator">{{ sortIndicator(col.key) }}</span>
            </th>
            <th :class="[styles.workflow__th, styles['workflow__th--actions']]"></th>
          </tr>
        </thead>
        <tbody
          :class="[styles.workflow__tbody, store.isLoading && styles['workflow__tbody--loading']]"
        >
          <tr
            v-for="step in steps"
            :key="step.id"
            :ref="(el) => { if (step.id === lastCreatedId) newStepRowRef = el as HTMLTableRowElement }"
            :class="[
              styles.workflow__row,
              store.selectedStepId === step.id && styles['workflow__row--selected'],
            ]"
            data-testid="workflow-row"
            @click.stop="onRowClick(step)"
          >
            <td :class="styles.workflow__td" @dblclick="startEdit(step)">
              <i class="fa-regular fa-file" :class="styles.workflow__fileIcon" :style="{ color: step.color }"></i>
              <template v-if="editingId === step.id">
                <input
                  ref="editInputRef"
                  v-model="editingName"
                  :class="styles.workflow__editInput"
                  @keydown.enter="commitEdit"
                  @keydown.escape="cancelEdit"
                  @blur="commitEdit"
                  @click.stop
                />
                <div v-if="editingError" :class="styles.workflow__editError">
                  {{ editingError }}
                </div>
              </template>
              <span v-else :class="styles.workflow__name">{{ step.name }}</span>
            </td>
            <td :class="styles.workflow__td">{{ step.x }}</td>
            <td :class="styles.workflow__td">{{ step.y }}</td>
            <td :class="styles.workflow__td">
              <span v-if="step.transitions.length === 0" :class="styles.workflow__noTransitions">—</span>
              <template v-else>
                <template v-for="(tid, idx) in step.transitions" :key="tid">
                  <span v-if="idx > 0">, </span>
                  <i class="fa-regular fa-file" :class="styles.workflow__fileIcon" :style="{ color: stepColor(tid) }"></i>{{ stepName(tid) }}
                </template>
              </template>
            </td>
            <td :class="[styles.workflow__td, styles['workflow__td--actions']]">
              <button
                type="button"
                :class="styles.workflow__deleteBtn"
                title="Удалить шаг"
                @click.stop="requestDelete(step.id)"
              >
                <i class="fa-solid fa-trash"></i>
              </button>
            </td>
          </tr>
          <tr v-if="!store.isLoading && steps.length === 0">
            <td :class="styles.workflow__empty" colspan="5">Ничего не найдено</td>
          </tr>
        </tbody>
      </table>
    </div>

    <Modal :open="pendingDeleteId !== null" @close="cancelDelete">
      <p>Удалить шаг «{{ deleteStepName }}»?</p>
      <div :class="styles.workflow__dialogActions">
        <button type="button" :class="styles.workflow__dialogCancel" @click="cancelDelete">
          Отмена
        </button>
        <button type="button" :class="styles.workflow__dialogConfirm" @click="confirmDelete">
          Удалить
        </button>
      </div>
    </Modal>

    <Modal
      :open="showCreateModal"
      :dialog-style="{ minWidth: '380px', maxWidth: '480px', width: '100%' }"
      @close="closeCreateModal"
    >
      <h2 :class="styles.workflow__dialogTitle">Новое состояние</h2>

      <div :class="styles.workflow__formGroup">
        <label :class="styles.workflow__formLabel">Название</label>
        <input
          ref="createNameInputRef"
          v-model="createName"
          :class="styles.workflow__formInput"
          placeholder="Введите название"
          @keydown.enter="submitCreate"
          @keydown.escape="closeCreateModal"
        />
        <div v-if="createError" :class="styles.workflow__editError">{{ createError }}</div>
      </div>

      <div :class="styles.workflow__formGroup">
        <label :class="styles.workflow__formLabel">Цвет</label>
        <div :class="styles.workflow__colorRow">
          <input type="color" v-model="createColor" :class="styles.workflow__colorInput" />
          <span :class="styles.workflow__colorValue">{{ createColor }}</span>
        </div>
      </div>

      <div v-if="store.steps.length > 0" :class="styles.workflow__formGroup">
        <label :class="styles.workflow__formLabel">Следующие шаги</label>
        <div :class="styles.workflow__checkboxList">
          <label
            v-for="step in store.steps"
            :key="step.id"
            :class="styles.workflow__checkboxItem"
          >
            <input type="checkbox" :value="step.id" v-model="createTransitions" />
            {{ step.name }}
          </label>
        </div>
      </div>

      <div :class="styles.workflow__dialogActions">
        <button type="button" :class="styles.workflow__dialogCancel" @click="closeCreateModal">
          Отмена
        </button>
        <button
          type="button"
          :class="[styles.workflow__dialogConfirm, styles['workflow__dialogConfirm--primary']]"
          :disabled="store.isMutating"
          @click="submitCreate"
        >
          Создать
        </button>
      </div>
    </Modal>
  </div>
</template>
