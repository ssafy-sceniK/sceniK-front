<script setup>
import { computed } from 'vue';
import { filterGenericAiCourseTags } from '../../utils/tags.js';

const props = defineProps({
  course: { type: Object, required: true },
  variant: { type: String, default: 'visual' },
  rank: { type: Number, default: 0 },
  hideGenericAiTag: { type: Boolean, default: true },
});

const visibleTags = computed(() => {
  const tags = Array.isArray(props.course.tags) ? props.course.tags : [];
  return props.hideGenericAiTag ? filterGenericAiCourseTags(tags) : tags;
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

function courseDurationLabel(course) {
  const value = course.durationDays ?? course.duration;
  if (value === null || value === undefined || value === '') return '';
  const text = String(value).trim();
  if (!text) return '';
  if (/\d+\s*일/.test(text)) return text.replace(/\s+/g, '');
  const dayMatch = text.match(/\d+/);
  if (dayMatch) return `${dayMatch[0]}\uC77C`;
  return text;
}

function courseMeta(course) {
  return [course.region, courseDurationLabel(course), `\uC7A5\uC18C ${routePlaceIds(course).length}\uACF3`].filter(Boolean).join(' \u00B7 ');
}
</script>

<template>
  <article class="course-card" :class="{ 'course-card--text': props.variant === 'text' }">
    <div class="course-body">
      <div class="card-row">
        <strong><span v-if="props.variant === 'text' && props.rank">{{ props.rank }}. </span>{{ course.title }}</strong>
      </div>
      <p>{{ courseMeta(course) }}</p>
      <small>{{ routePlaceNames(course) }}</small>
      <div class="tag-row">
        <span v-for="tag in visibleTags" :key="tag">{{ tag }}</span>
      </div>
    </div>
  </article>
</template>
