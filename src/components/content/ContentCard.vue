<script setup>
import { computed } from 'vue';

const props = defineProps({
  content: { type: Object, required: true },
  selected: { type: Boolean, default: false },
});

const placeCount = computed(() => props.content.placeCount
  ?? props.content.relatedPlaceCount
  ?? 0);

function useFallbackImage(event) {
  if (event.currentTarget.dataset.fallbackApplied) return;
  event.currentTarget.dataset.fallbackApplied = 'true';
  event.currentTarget.src = '/images/kdrama-scene.jpg';
}
</script>

<template>
  <article class="poster-card" :class="{ selected }">
    <div class="poster-image">
      <img :src="content.thumbnailUrl" :alt="content.title" @error="useFallbackImage" />
      <span class="badge dark">{{ content.category }}</span>
      <span v-if="selected" class="selected-check">✓</span>
    </div>
    <strong>{{ content.title }}</strong>
    <p>장소 {{ placeCount }}곳</p>
  </article>
</template>
