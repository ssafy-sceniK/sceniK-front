<script setup>
import { computed } from 'vue';

defineOptions({
  name: 'CourseCrudPanel',
});

const props = defineProps({
  title: {
    type: String,
    default: '코스 관리',
  },
  description: {
    type: String,
    default: '코스 정보를 확인하고 필요한 작업을 이어갈 수 있습니다.',
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
  { label: '코스명', value: props.courseTitle || '생성된 AI 코스' },
  { label: '방문 장소', value: props.placeCount + '곳' },
  { label: '지역', value: props.regionLabel },
  { label: '기간', value: props.durationLabel },
  { label: '이동수단', value: props.transportLabel },
].filter((item) => item.value));
</script>

<template>
  <section class="course-crud-panel" aria-labelledby="course-crud-panel-title">
    <div class="course-crud-panel__head">
      <div>
        <span class="course-crud-panel__eyebrow">내 여행 코스</span>
        <h2 id="course-crud-panel-title">{{ props.title }}</h2>
        <p>{{ props.description }}</p>
      </div>
    </div>

    <dl class="course-crud-panel__meta" aria-label="코스 정보">
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
