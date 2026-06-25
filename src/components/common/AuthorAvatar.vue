<script setup>
import { computed, ref, watch } from 'vue';
import { resolveApiAssetUrl } from '../../api/http.js';

defineOptions({
  name: 'AuthorAvatar',
});

const props = defineProps({
  imageUrl: {
    type: String,
    default: '',
  },
  initial: {
    type: String,
    default: 'K',
  },
  alt: {
    type: String,
    default: '',
  },
});

const imageFailed = ref(false);

const resolvedImageUrl = computed(() => {
  if (imageFailed.value) return '';
  return resolveApiAssetUrl(props.imageUrl);
});

watch(() => props.imageUrl, () => {
  imageFailed.value = false;
});

function handleImageError() {
  imageFailed.value = true;
}
</script>

<template>
  <span class="author-avatar" :class="{ 'author-avatar--image': resolvedImageUrl }">
    <img v-if="resolvedImageUrl" :src="resolvedImageUrl" :alt="alt" @error="handleImageError" />
    <span v-else class="author-avatar-initial" aria-hidden="true">{{ initial }}</span>
  </span>
</template>

<style scoped>
.author-avatar {
  overflow: hidden;
  flex: 0 0 auto;
}

.author-avatar img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  border-radius: inherit;
}

.author-avatar--image {
  padding: 0;
  background: #f4f6fb;
}

.author-avatar-initial {
  line-height: 1;
}
</style>