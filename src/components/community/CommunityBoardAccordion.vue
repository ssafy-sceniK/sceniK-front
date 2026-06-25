<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import CommunityBoardIcon from './CommunityBoardIcon.vue';

const props = defineProps({
  modelValue: { type: String, required: true },
  boards: { type: Array, required: true },
  ariaLabel: { type: String, default: '' },
  compact: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue']);

const root = ref(null);
const open = ref(false);

const selectedBoard = computed(() => (
  props.boards.find((board) => board.id === props.modelValue) ?? props.boards[0] ?? null
));

function boardLabel(board) {
  return board?.name ?? board?.label ?? '';
}

function boardDescription(board) {
  return board?.description ?? board?.fullName ?? '';
}

function toggleOpen() {
  open.value = !open.value;
}

function selectBoard(board) {
  if (!board?.id) return;
  emit('update:modelValue', board.id);
  open.value = false;
}

function handlePointerDown(event) {
  if (!open.value || !root.value || root.value.contains(event.target)) return;
  open.value = false;
}

function handleKeydown(event) {
  if (event.key !== 'Escape') return;
  open.value = false;
}

onMounted(() => {
  document.addEventListener('pointerdown', handlePointerDown);
  document.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handlePointerDown);
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <div
    ref="root"
    class="community-board-picker"
    :class="{ 'community-board-picker--compact': compact, 'is-open': open }"
  >
    <button
      type="button"
      class="community-board-picker__toggle"
      :aria-label="ariaLabel"
      :aria-expanded="open"
      @click="toggleOpen"
    >
      <span
        :class="['board-icon', selectedBoard ? `board-${selectedBoard.id}` : '', 'community-board-picker__icon']"
        aria-hidden="true"
      >
        <span class="board-icon-symbol"><CommunityBoardIcon :type="selectedBoard?.id" /></span>
      </span>
      <span class="community-board-picker__copy">
        <strong>{{ boardLabel(selectedBoard) }}</strong>
        <small v-if="boardDescription(selectedBoard)">{{ boardDescription(selectedBoard) }}</small>
      </span>
      <span class="community-board-picker__chevron" :class="{ open }" aria-hidden="true"></span>
    </button>

    <div v-if="open" class="community-board-picker__list">
      <button
        v-for="board in boards"
        :key="board.id"
        type="button"
        class="community-board-picker__option"
        :class="{ 'is-selected': board.id === modelValue }"
        @click="selectBoard(board)"
      >
        <span :class="['board-icon', `board-${board.id}`, 'community-board-picker__option-icon']" aria-hidden="true">
          <span class="board-icon-symbol"><CommunityBoardIcon :type="board.id" /></span>
        </span>
        <span class="community-board-picker__copy">
          <strong>{{ boardLabel(board) }}</strong>
          <small v-if="boardDescription(board)">{{ boardDescription(board) }}</small>
        </span>
      </button>
    </div>
  </div>
</template>
