<script setup>
import { computed } from 'vue';
import { applyNeutralContentImageFallback, getContentImageUrl } from '../../utils/contentImages.js';

const props = defineProps({
  content: { type: Object, required: true },
  selected: { type: Boolean, default: false },
});

const imageUrl = computed(() => getContentImageUrl(props.content));

function useFallbackImage(event) {
  applyNeutralContentImageFallback(event);
}
</script>

<template>
  <article class="poster-card" :class="{ selected }">
    <div class="poster-image">
      <img :key="imageUrl" :src="imageUrl" :alt="content.title" @error="useFallbackImage" />
      <span class="badge dark">{{ content.category }}</span>
      <span v-if="selected" class="selected-check">✓</span>
    </div>
    <strong>{{ content.title }}</strong>
  </article>
</template>
