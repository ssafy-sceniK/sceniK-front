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

</script>

<template>
  <article class="course-card" :class="{ 'course-card--text': props.variant === 'text' }">
    <div class="course-body">
      <div class="card-row">
        <strong><span v-if="props.variant === 'text' && props.rank">{{ props.rank }}. </span>{{ course.title }}</strong>
      </div>
      <p><span class="heart-mark">♥</span> {{ course.likes ?? 0 }} · 장소 {{ routePlaceIds(course).length }}곳</p>
      <small>{{ routePlaceNames(course) }}</small>
      <div class="tag-row">
        <span v-for="tag in (course.tags ?? [])" :key="tag">{{ tag }}</span>
      </div>
    </div>
  </article>
</template>
