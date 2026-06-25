<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import FormStatusNotice from '../common/FormStatusNotice.vue';

const { t } = useI18n();

defineOptions({
  name: 'CourseSaveStatusPanel',
});

const props = defineProps({
  title: {
    type: String,
    default: null,
  },
  eyebrow: {
    type: String,
    default: null,
  },
  description: {
    type: String,
    default: null,
  },
  rows: {
    type: Array,
    default: () => [],
  },
  notice: {
    type: Object,
    default: null,
  },
});

const eyebrowText = computed(() => props.eyebrow === null ? t('course.cleanup.kd97a76eb1c') : props.eyebrow);
const titleText = computed(() => props.title === null ? t('course.cleanup.kcbd04b451d') : props.title);
const descriptionText = computed(() => props.description === null ? t('course.cleanup.k30ff523c4c') : props.description);
</script>

<template>
  <section class="course-save-status-panel" aria-labelledby="course-save-status-title">
    <div>
      <span v-if="eyebrowText">{{ eyebrowText }}</span>
      <h2 id="course-save-status-title">{{ titleText }}</h2>
      <p v-if="descriptionText">{{ descriptionText }}</p>
    </div>
    <dl v-if="props.rows.length" :aria-label="t('course.cleanup.k9f2b9841d5')">
      <template v-for="row in props.rows" :key="row.label">
        <dt>{{ row.label }}</dt>
        <dd>{{ row.value }}</dd>
      </template>
    </dl>
    <FormStatusNotice
      v-if="props.notice"
      compact
      :tone="props.notice.tone"
      :title="props.notice.title"
      :text="props.notice.text"
    />
  </section>
</template>
