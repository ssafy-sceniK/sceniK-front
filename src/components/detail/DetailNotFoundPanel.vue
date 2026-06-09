<script setup>
import EmptyState from '../common/EmptyState.vue';

defineOptions({
  name: 'DetailNotFoundPanel',
});

const props = defineProps({
  title: {
    type: String,
    default: '상세 정보를 찾을 수 없습니다',
  },
  text: {
    type: String,
    default: '요청한 항목이 없거나 더 이상 제공되지 않습니다.',
  },
  retryLabel: {
    type: String,
    default: '다시 시도',
  },
  listLabel: {
    type: String,
    default: '목록으로 돌아가기',
  },
  listTo: {
    type: String,
    default: '/home',
  },
});

const emit = defineEmits(['retry']);
</script>

<template>
  <section class="detail-not-found-panel" aria-label="상세 오류 복구">
    <EmptyState
      icon="!"
      tone="error"
      :title="props.title"
      :text="props.text"
      :action-label="props.retryLabel"
      :secondary-label="props.listLabel"
      :secondary-to="props.listTo"
      @action="emit('retry')"
    />
  </section>
</template>
