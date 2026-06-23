<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { applyNeutralContentImageFallback, getContentImageUrl } from '../../utils/contentImages.js';
import { localizeContent, localizeSystemLabel } from '../../i18n/systemContent.js';

const props = defineProps({
  content: { type: Object, required: true },
  selected: { type: Boolean, default: false },
});

const { locale, t } = useI18n();
const imageUrl = computed(() => getContentImageUrl(props.content));
const displayContent = computed(() => localizeContent(props.content, locale.value));
const categoryLabel = computed(() => localizeSystemLabel(props.content.category, 'category', t, locale.value));

function useFallbackImage(event) {
  applyNeutralContentImageFallback(event);
}
</script>

<template>
  <article class="poster-card" :class="{ selected }">
    <div class="poster-image">
      <img :key="imageUrl" :src="imageUrl" :alt="displayContent.title" @error="useFallbackImage" />
      <span class="badge dark">{{ categoryLabel }}</span>
      <span v-if="selected" class="selected-check">✓</span>
    </div>
    <strong>{{ displayContent.title }}</strong>
  </article>
</template>