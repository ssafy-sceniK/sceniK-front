<script setup>
defineOptions({
  name: 'FavoriteToggleStatus',
});

const props = defineProps({
  active: {
    type: Boolean,
    default: false,
  },
  pending: {
    type: Boolean,
    default: false,
  },
  activeText: {
    type: String,
    default: '좋아요 완료',
  },
  inactiveText: {
    type: String,
    default: '좋아요 취소됨',
  },
  pendingText: {
    type: String,
    default: '상태를 저장하는 중입니다',
  },
});
</script>

<template>
  <p class="favorite-toggle-status" aria-live="polite">
    {{ props.pending ? props.pendingText : props.active ? props.activeText : props.inactiveText }}
  </p>
</template>

<style scoped>
.favorite-toggle-status {
  margin: 8px 0 0;
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 800;
}
</style>
