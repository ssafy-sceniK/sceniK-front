<script setup>
const props = defineProps({
  course: { type: Object, required: true },
  variant: { type: String, default: 'visual' },
  rank: { type: Number, default: 0 },
});

function routePlaceIds(course) {
  if (Array.isArray(course.places)) return course.places;
  if (Array.isArray(course.days)) return course.days.flatMap((day) => day.places ?? []).map((place) => place.placeId);
  return [];
}

function routePlaceNames(course) {
  const dayStops = (course.days ?? [])
    .flatMap((day) => day.places ?? [])
    .map((place) => place.placeName ?? place.name)
    .filter(Boolean);
  if (dayStops.length) return dayStops.join(' → ');

  const candidateNames = (course.candidatePlaces ?? [])
    .map((place) => place.placeName ?? place.name)
    .filter(Boolean);
  if (candidateNames.length) return candidateNames.join(' → ');

  return '';
}

function regionLabel(course) {
  return course.region?.slice(0, 2) || course.tags?.find((tag) => tag.length <= 3) || 'KR';
}
</script>

<template>
  <article class="course-card" :class="{ 'course-card--text': props.variant === 'text' }">
    <div v-if="props.variant === 'text'" class="course-rank-badge" aria-hidden="true">
      <span>{{ props.rank ? `#${props.rank}` : regionLabel(course) }}</span>
      <small>AI</small>
    </div>
    <div v-else class="course-visual" aria-hidden="true">
      <svg class="course-mini-route" viewBox="0 0 64 64">
        <path d="M10 44 C20 32, 22 26, 33 30 S44 43, 54 20" />
      </svg>
      <span v-for="(id, index) in routePlaceIds(course).slice(0, 4)" :key="id" :style="{ left: `${18 + index * 18}%`, top: `${28 + (index % 2) * 26}%` }"></span>
      <b>{{ regionLabel(course) }}</b>
    </div>
    <div class="course-body">
      <div class="card-row">
        <strong>{{ course.title }}</strong>
      </div>
      <p><span class="heart-mark">♥</span> {{ course.likes ?? 0 }} · 장소 {{ routePlaceIds(course).length }}곳</p>
      <small>{{ routePlaceNames(course) }}</small>
      <div class="tag-row">
        <span v-for="tag in (course.tags ?? [])" :key="tag">{{ tag }}</span>
      </div>
    </div>
  </article>
</template>
