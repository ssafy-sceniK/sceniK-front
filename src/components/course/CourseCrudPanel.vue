<script setup>
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';

const { t } = useI18n();

defineOptions({
  name: 'CourseCrudPanel',
});

const props = defineProps({
  title: {
    type: String,
    default: '\ucf54\uc2a4 \uad00\ub9ac',
  },
  description: {
    type: String,
    default: '\ucf54\uc2a4 \uc815\ubcf4\ub97c \ud655\uc778\ud558\uace0 \ud544\uc694\ud55c \uc791\uc5c5\uc744 \uc774\uc5b4\uac08 \uc218 \uc788\uc2b5\ub2c8\ub2e4.',
  },
  courseTitle: {
    type: String,
    default: '',
  },
  placeCount: {
    type: Number,
    default: 0,
  },
  regionLabel: {
    type: String,
    default: '',
  },
  durationLabel: {
    type: String,
    default: '',
  },
  transportLabel: {
    type: String,
    default: '',
  },
});

const metaItems = computed(() => [
  { label: t('course.cleanup.k84354cfa8d'), value: props.courseTitle || t('course.cleanup.kcbd04b451d') },
  { label: t('course.cleanup.ke4ff0abb48'), value: props.placeCount + t('course.cleanup.k960f39a4cc') },
  { label: t('course.cleanup.k9aa330dae0'), value: props.regionLabel },
  { label: t('course.cleanup.kab4ec9e629'), value: props.durationLabel },
  { label: t('course.cleanup.k286b8c3295'), value: props.transportLabel },
].filter((item) => item.value));
</script>

<template>
  <section class="course-crud-panel" aria-labelledby="course-crud-panel-title">
    <div class="course-crud-panel__head">
      <div>
        <span class="course-crud-panel__eyebrow">{{ t('course.cleanup.k561dde29a9') }}</span>
        <h2 id="course-crud-panel-title">{{ props.title }}</h2>
        <p>{{ props.description }}</p>
      </div>
    </div>

    <dl class="course-crud-panel__meta" :aria-label="t('course.cleanup.ke49c74a878')">
      <div v-for="item in metaItems" :key="item.label">
        <dt>{{ item.label }}</dt>
        <dd>{{ item.value }}</dd>
      </div>
    </dl>

    <slot name="status"></slot>
    <div class="course-crud-panel__actions">
      <slot name="actions"></slot>
    </div>
  </section>
</template>
