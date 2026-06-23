<script setup>
import BaseButton from '../common/BaseButton.vue';
import { motion } from 'motion-v';
import { motionVariants } from '../../utils/motion.js';

defineOptions({
  name: 'CourseDeleteActionSheet',
});

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '저장한 코스를 삭제할까요?',
  },
  description: {
    type: String,
    default: '삭제하면 마이페이지 저장 코스 목록에서 사라집니다. 같은 조건으로 다시 생성하거나 저장할 수 있습니다.',
  },
});

const emit = defineEmits(['confirm', 'cancel']);
</script>

<template>
  <motion.div class="sheet-backdrop" v-bind="motionVariants.backdrop()" @click="emit('cancel')">
    <motion.div
      class="bottom-sheet delete-course-sheet"
      role="dialog"
      aria-modal="true"
      aria-label="저장한 코스 삭제"
      @click.stop
      v-bind="motionVariants.bottomSheet()"
    >
      <div class="sheet-handle"></div>
      <h2>{{ props.title }}</h2>
      <p>{{ props.description }}</p>
      <div class="sheet-actions two">
        <BaseButton variant="secondary" :disabled="props.loading" @click="emit('cancel')">취소</BaseButton>
        <BaseButton variant="danger" :disabled="props.loading" @click="emit('confirm')">
          {{ props.loading ? '삭제 중...' : '삭제' }}
        </BaseButton>
      </div>
    </motion.div>
  </motion.div>
</template>
