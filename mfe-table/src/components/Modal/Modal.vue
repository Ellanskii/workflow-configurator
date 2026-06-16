<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

const props = defineProps<{
  open: boolean;
  dialogStyle?: Record<string, string>;
}>();
const emit = defineEmits<{ close: [] }>();

function onKey(e: KeyboardEvent) {
  if (props.open && e.key === 'Escape') emit('close');
}

onMounted(() => window.addEventListener('keydown', onKey));
onUnmounted(() => window.removeEventListener('keydown', onKey));
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal-overlay" @click.self="emit('close')">
      <div class="modal-dialog" :style="dialogStyle">
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.modal-dialog {
  background: #ffffff;
  border-radius: 4px;
  padding: 24px;
  min-width: 280px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}
</style>
