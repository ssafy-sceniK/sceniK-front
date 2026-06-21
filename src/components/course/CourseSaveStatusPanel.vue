<script setup>
import FormStatusNotice from '../common/FormStatusNotice.vue';

defineOptions({
  name: 'CourseSaveStatusPanel',
});

const props = defineProps({
  title: {
    type: String,
    default: '생성된 AI 코스',
  },
  eyebrow: {
    type: String,
    default: '저장 전 확인',
  },
  description: {
    type: String,
    default: '저장 전 검증된 장소와 코스 조건을 확인합니다.',
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
      <span v-if="props.eyebrow">{{ props.eyebrow }}</span>
      <h2 id="course-save-status-title">{{ props.title }}</h2>
      <p v-if="props.description">{{ props.description }}</p>
    </div>
    <dl v-if="props.rows.length" aria-label="AI 코스 저장 정보">
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
