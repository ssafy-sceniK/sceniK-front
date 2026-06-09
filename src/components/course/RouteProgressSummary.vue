<script setup>
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
  <section class="route-progress-summary" aria-label="코스 편집 진행 요약">
    <div>
      <span>장소 수</span>
      <strong>{{ props.placesCount }}</strong>
    </div>
    <div v-if="props.durationDays">
      <span>일정</span>
      <strong>{{ props.durationDays }}일</strong>
    </div>
    <div v-if="props.transport">
      <span>이동</span>
      <strong>{{ props.transport }}</strong>
    </div>
    <div v-if="props.styleLabel">
      <span>스타일</span>
      <strong>{{ props.styleLabel }}</strong>
    </div>
    <div v-if="props.changedCount">
      <span>저장 전 변경사항</span>
      <strong>{{ props.changedCount }}</strong>
    </div>
  </section>
</template>
