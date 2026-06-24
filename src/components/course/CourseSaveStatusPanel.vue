<script setup>
import { useI18n } from 'vue-i18n';
import FormStatusNotice from '../common/FormStatusNotice.vue';

const { t } = useI18n();

defineOptions({
  name: 'CourseSaveStatusPanel',
});

const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  eyebrow: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
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
</script>

<template>
  <section class="course-save-status-panel" aria-labelledby="course-save-status-title">
    <div>
      <span>{{ props.eyebrow || t('course.cleanup.kd97a76eb1c') }}</span>
      <h2 id="course-save-status-title">{{ props.title || t('course.cleanup.kcbd04b451d') }}</h2>
      <p>{{ props.description || t('course.cleanup.k30ff523c4c') }}</p>
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
