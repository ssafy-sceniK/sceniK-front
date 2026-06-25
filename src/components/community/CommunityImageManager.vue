<script setup>
import { computed, onBeforeUnmount, ref } from 'vue';

defineOptions({
  name: 'CommunityImageManager',
});

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  max: { type: Number, default: 10 },
  title: { type: String, default: '' },
  help: { type: String, default: '' },
  addLabel: { type: String, required: true },
  addHelp: { type: String, default: '' },
  dragHint: { type: String, default: '' },
  removeLabel: { type: String, required: true },
  newBadge: { type: String, default: '' },
  representativeLabel: { type: String, default: '' },
  existingAlt: { type: String, default: 'Attached image {index}' },
  newAlt: { type: String, default: 'New image {index}' },
  reorderLabel: { type: String, default: 'Reorder image' },
  emptyText: { type: String, default: '' },
  inputIdPrefix: { type: String, default: 'community-image-manager' },
});

const emit = defineEmits(['update:modelValue', 'add-files', 'remove']);

const dragSourceKey = ref('');
const dragOverKey = ref('');
const pointerDragKey = ref('');
let pointerDragState = null;
let longPressTimer = 0;
const fileInputId = computed(() => `${props.inputIdPrefix}-file-input`);
const remainingCount = computed(() => Math.max(0, props.max - props.modelValue.length));
const isFull = computed(() => remainingCount.value <= 0);
const LONG_PRESS_DELAY = 220;
const TOUCH_MOVE_CANCEL_DISTANCE = 24;

function formatLabel(template, index) {
  return String(template || '').replace('{index}', String(index + 1));
}

function itemName(item, index) {
  return item?.name || item?.file?.name || `image-${index + 1}`;
}

function itemAlt(item, index) {
  return formatLabel(item?.kind === 'new' ? props.newAlt : props.existingAlt, index);
}

function emitAddFiles(files) {
  const imageFiles = Array.from(files ?? []).filter((file) => file?.type?.startsWith('image/'));
  if (imageFiles.length) emit('add-files', imageFiles);
}

function handleInputChange(event) {
  emitAddFiles(event.target?.files);
  if (event.target) event.target.value = '';
}

function handleFileDrop(event) {
  event.preventDefault();
  emitAddFiles(event.dataTransfer?.files);
}

function updateItems(items) {
  emit('update:modelValue', items);
}

function moveItem(sourceKey, targetKey) {
  if (!sourceKey || !targetKey || sourceKey === targetKey) return;
  const sourceIndex = props.modelValue.findIndex((item) => item.localKey === sourceKey);
  const targetIndex = props.modelValue.findIndex((item) => item.localKey === targetKey);
  if (sourceIndex < 0 || targetIndex < 0) return;

  const next = [...props.modelValue];
  const [moved] = next.splice(sourceIndex, 1);
  next.splice(targetIndex, 0, moved);
  updateItems(next);
}

function itemKeyFromPoint(clientX, clientY) {
  const target = document.elementFromPoint(clientX, clientY);
  return target?.closest?.('[data-image-key]')?.dataset?.imageKey ?? '';
}

function clearPointerDragState() {
  window.clearTimeout(longPressTimer);
  longPressTimer = 0;
  if (pointerDragState?.target && pointerDragState?.pointerId != null) {
    try {
      pointerDragState.target.releasePointerCapture?.(pointerDragState.pointerId);
    } catch {
      // Pointer capture may already be released by the browser.
    }
  }
  pointerDragState = null;
  pointerDragKey.value = '';
  dragSourceKey.value = '';
  dragOverKey.value = '';
}

function beginTouchReorder(item, event) {
  if (event.pointerType === 'mouse' || event.button !== 0) return;
  if (event.target?.closest?.('button, input, label, a')) return;
  event.preventDefault();

  pointerDragState = {
    pointerId: event.pointerId,
    sourceKey: item.localKey,
    startX: event.clientX,
    startY: event.clientY,
    dragging: false,
    targetKey: '',
    target: event.currentTarget,
  };
  pointerDragState.target?.setPointerCapture?.(event.pointerId);
  window.clearTimeout(longPressTimer);
  longPressTimer = window.setTimeout(() => {
    if (!pointerDragState || pointerDragState.pointerId !== event.pointerId) return;
    pointerDragState.dragging = true;
    pointerDragKey.value = item.localKey;
    dragSourceKey.value = item.localKey;
  }, LONG_PRESS_DELAY);
}

function handleTouchReorderMove(event) {
  if (!pointerDragState || pointerDragState.pointerId !== event.pointerId) return;
  event.preventDefault();
  const deltaX = event.clientX - pointerDragState.startX;
  const deltaY = event.clientY - pointerDragState.startY;
  const distance = Math.hypot(deltaX, deltaY);

  if (!pointerDragState.dragging && distance > TOUCH_MOVE_CANCEL_DISTANCE) {
    clearPointerDragState();
    return;
  }

  if (!pointerDragState.dragging) return;
  const targetKey = itemKeyFromPoint(event.clientX, event.clientY);
  pointerDragState.targetKey = targetKey;
  dragOverKey.value = targetKey && targetKey !== pointerDragState.sourceKey ? targetKey : '';
}

function endTouchReorder(event) {
  if (!pointerDragState || pointerDragState.pointerId !== event.pointerId) return;
  if (pointerDragState.dragging && pointerDragState.targetKey) {
    moveItem(pointerDragState.sourceKey, pointerDragState.targetKey);
  }
  clearPointerDragState();
}

function handleDragStart(item, event) {
  dragSourceKey.value = item.localKey;
  dragOverKey.value = '';
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', item.localKey);
}

function handleDragOver(item, event) {
  event.preventDefault();
  if (!dragSourceKey.value || dragSourceKey.value === item.localKey) return;
  dragOverKey.value = item.localKey;
  event.dataTransfer.dropEffect = 'move';
}

function handleDrop(item, event) {
  event.preventDefault();
  const sourceKey = dragSourceKey.value || event.dataTransfer.getData('text/plain');
  moveItem(sourceKey, item.localKey);
  dragSourceKey.value = '';
  dragOverKey.value = '';
}

function clearDragState() {
  dragSourceKey.value = '';
  dragOverKey.value = '';
}

onBeforeUnmount(clearPointerDragState);
</script>

<template>
  <div class="community-image-manager">
    <div v-if="title || help" class="community-image-manager__heading">
      <strong v-if="title">{{ title }}</strong>
      <small v-if="help">{{ help }}</small>
    </div>

    <label
      class="community-image-manager__dropzone"
      :class="{ 'is-full': isFull }"
      :for="fileInputId"
      @dragover.prevent
      @drop="handleFileDrop"
    >
      <span class="community-image-manager__upload-icon" aria-hidden="true">+</span>
      <span class="community-image-manager__upload-copy">
        <strong>{{ addLabel }}</strong>
        <small>{{ addHelp }}</small>
      </span>
      <input
        :id="fileInputId"
        type="file"
        accept="image/*"
        multiple
        :disabled="isFull"
        @change="handleInputChange"
      />
    </label>

    <small v-if="modelValue.length && dragHint" class="community-image-manager__hint">{{ dragHint }}</small>
    <p v-else-if="!modelValue.length && emptyText" class="community-image-manager__empty">{{ emptyText }}</p>

    <div v-if="modelValue.length" class="community-image-manager__grid" role="list">
      <figure
        v-for="(item, index) in modelValue"
        :key="item.localKey"
        class="community-image-manager__item"
        :class="{
          'is-new': item.kind === 'new',
          'is-dragging': dragSourceKey === item.localKey,
          'is-drag-over': dragOverKey === item.localKey,
          'is-touch-reordering': pointerDragKey === item.localKey,
        }"
        :data-image-key="item.localKey"
        draggable="true"
        role="listitem"
        :aria-label="`${reorderLabel}: ${itemName(item, index)}`"
        @dragstart="handleDragStart(item, $event)"
        @dragover="handleDragOver(item, $event)"
        @drop="handleDrop(item, $event)"
        @dragend="clearDragState"
        @pointerdown="beginTouchReorder(item, $event)"
        @pointermove="handleTouchReorderMove"
        @pointerup="endTouchReorder"
        @pointercancel="clearPointerDragState"
        @contextmenu.prevent
      >
        <div class="community-image-manager__frame" @contextmenu.prevent>
          <img v-if="item.isImage && item.previewUrl" :src="item.previewUrl" :alt="itemAlt(item, index)" draggable="false" @contextmenu.prevent />
          <span v-else class="community-image-manager__fallback">{{ itemName(item, index) }}</span>
          <span v-if="index === 0 && representativeLabel" class="community-image-manager__representative">{{ representativeLabel }}</span>
          <span v-if="item.kind === 'new' && newBadge" class="community-image-manager__badge">{{ newBadge }}</span>
          <button
            type="button"
            class="community-image-manager__remove"
            :aria-label="removeLabel"
            :title="removeLabel"
            draggable="false"
            @click="emit('remove', item.localKey)"
          >
            x
          </button>
        </div>
        <figcaption>{{ itemName(item, index) }}</figcaption>
      </figure>
    </div>
  </div>
</template>
