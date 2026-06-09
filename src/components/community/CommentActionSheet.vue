<script setup>
import BaseButton from '../common/BaseButton.vue';

defineOptions({
  name: 'CommentActionSheet',
});

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['edit', 'delete', 'cancel']);
</script>

<template>
  <div class="sheet-backdrop comment-action-backdrop" @click="emit('cancel')">
    <div
      class="bottom-sheet comment-action-sheet"
      role="dialog"
      aria-modal="true"
      aria-label="댓글 관리"
      tabindex="-1"
      @keydown.esc.prevent="emit('cancel')"
      @click.stop
    >
      <div class="sheet-handle"></div>
      <h2>댓글을 관리할까요?</h2>
      <p>내가 작성한 댓글만 수정하거나 삭제할 수 있습니다. 삭제하면 목록에서 바로 제거됩니다.</p>
      <div class="sheet-actions two">
        <BaseButton variant="secondary" @click="emit('edit')">수정</BaseButton>
        <BaseButton variant="danger" :disabled="props.loading" @click="emit('delete')">
          {{ props.loading ? '삭제 중...' : '삭제' }}
        </BaseButton>
      </div>
      <BaseButton variant="secondary" block @click="emit('cancel')">취소</BaseButton>
    </div>
  </div>
</template>
