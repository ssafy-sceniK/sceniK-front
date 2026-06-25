<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { filterGenericAiCourseTags, filterPublicUserTags } from '../../utils/tags.js';

const { t } = useI18n();

const props = defineProps({
  course: { type: Object, required: true },
  variant: { type: String, default: 'visual' },
  rank: { type: Number, default: 0 },
  hideGenericAiTag: { type: Boolean, default: true },
});

const visibleTags = computed(() => {
  const tags = filterPublicUserTags(Array.isArray(props.course.tags) ? props.course.tags : []);
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
  const dayMatch = text.match(/\d+/);
  if (dayMatch) return t('course.detail.durationDays', { count: Number(dayMatch[0]) });
  return text;
}

function courseMeta(course) {
  return [course.region, courseDurationLabel(course), t('course.detail.placeCount', { count: routePlaceIds(course).length })].filter(Boolean).join(' \u00B7 ');
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
