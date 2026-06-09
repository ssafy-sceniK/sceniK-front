<script setup>
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
    default: '저장한 코스의 수정, 공유, 삭제 상태를 한곳에서 확인합니다.',
  },
  courseTitle: {
    type: String,
    default: '',
  },
  routeId: {
    type: [String, Number],
    default: '',
  },
  sourceLabel: {
    type: String,
    default: '',
  },
  placeCount: {
    type: Number,
    default: 0,
  },
  updatedAt: {
    type: String,
    default: '',
  },
});
</script>

<template>
  <section class="course-crud-panel" aria-labelledby="course-crud-panel-title">
    <div class="course-crud-panel__head">
      <div>
        <span class="course-crud-panel__eyebrow">{{ props.sourceLabel || 'Course entity' }}</span>
        <h2 id="course-crud-panel-title">{{ props.title }}</h2>
        <p>{{ props.description }}</p>
      </div>
    </div>

    <dl class="course-crud-panel__meta" aria-label="코스 엔티티 정보">
      <div>
        <dt>코스명</dt>
        <dd>{{ props.courseTitle || '생성된 AI 코스' }}</dd>
      </div>
      <div>
        <dt>장소 수</dt>
        <dd>{{ props.placeCount }}곳</dd>
      </div>
      <div v-if="props.routeId">
        <dt>routeId</dt>
        <dd>{{ props.routeId }}</dd>
      </div>
      <div>
        <dt>상태</dt>
        <dd>{{ props.updatedAt || '저장 후 내 코스에서 수정 가능' }}</dd>
      </div>
    </dl>

    <slot name="status"></slot>
    <div class="course-crud-panel__actions">
      <slot name="actions"></slot>
    </div>
  </section>
</template>
