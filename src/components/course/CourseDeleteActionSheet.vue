<script setup>
import { useI18n } from 'vue-i18n';
import BaseButton from '../common/BaseButton.vue';
import { motion } from 'motion-v';
import { motionVariants } from '../../utils/motion.js';

const { t } = useI18n();

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
    default: '\uc800\uc7a5\ud55c \ucf54\uc2a4\ub97c \uc0ad\uc81c\ud560\uae4c\uc694?',
  },
  description: {
    type: String,
    default: '\uc0ad\uc81c\ud558\uba74 \ub9c8\uc774\ud398\uc774\uc9c0 \uc800\uc7a5 \ucf54\uc2a4 \ubaa9\ub85d\uc5d0\uc11c \uc0ac\ub77c\uc9d1\ub2c8\ub2e4. \uac19\uc740 \uc870\uac74\uc73c\ub85c \ub2e4\uc2dc \uc0dd\uc131\ud558\uac70\ub098 \uc800\uc7a5\ud560 \uc218 \uc788\uc2b5\ub2c8\ub2e4.',
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
      :aria-label="t('course.cleanup.k4f28a69ed2')"
      @click.stop
      v-bind="motionVariants.bottomSheet()"
    >
      <div class="sheet-handle"></div>
      <h2>{{ props.title }}</h2>
      <p>{{ props.description }}</p>
      <div class="sheet-actions two">
        <BaseButton variant="secondary" :disabled="props.loading" @click="emit('cancel')">{{ t('course.cleanup.k37fb28c81d') }}</BaseButton>
        <BaseButton variant="danger" :disabled="props.loading" @click="emit('confirm')">
          {{ props.loading ? t('course.cleanup.k61aff68fbb') : t('course.cleanup.k627604e374') }}
        </BaseButton>
      </div>
    </motion.div>
  </motion.div>
</template>
