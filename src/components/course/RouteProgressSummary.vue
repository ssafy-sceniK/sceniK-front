<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
defineOptions({
  name: 'RouteProgressSummary',
});

const props = defineProps({
  placesCount: {
    type: Number,
    default: 0,
  },
  durationDays: {
    type: [String, Number],
    default: '',
  },
  transport: {
    type: String,
    default: '',
  },
  styleLabel: {
    type: String,
    default: '',
  },
  changedCount: {
    type: Number,
    default: 0,
  },
});
</script>

<template>
  <section class="route-progress-summary" :aria-label="t('course.cleanup.k405f13b0de')">
    <div>
      <span>{{ t('course.cleanup.k569f9f968a') }}</span>
      <strong>{{ props.placesCount }}</strong>
    </div>
    <div v-if="props.durationDays">
      <span>{{ t('course.cleanup.kc33c472bf5') }}</span>
      <strong>{{ t('course.cleanup.k7591815a45', { count: props.durationDays }) }}</strong>
    </div>
    <div v-if="props.transport">
      <span>{{ t('course.cleanup.kebe8916a4d') }}</span>
      <strong>{{ props.transport }}</strong>
    </div>
    <div v-if="props.styleLabel">
      <span>{{ t('course.cleanup.k28c95e9c39') }}</span>
      <strong>{{ props.styleLabel }}</strong>
    </div>
    <div v-if="props.changedCount">
      <span>{{ t('course.cleanup.kf4761e95f0') }}</span>
      <strong>{{ props.changedCount }}</strong>
    </div>
  </section>
</template>
