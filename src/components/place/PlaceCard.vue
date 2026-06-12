<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  place: { type: Object, required: true },
  compact: { type: Boolean, default: false },
});

const imageLoadFailed = ref(false);
const imageUrl = computed(() => props.place?.imageUrl || '');
const placeInitial = computed(() => props.place?.placeName?.trim?.().slice(0, 1) || 'P');

watch(imageUrl, () => {
  imageLoadFailed.value = false;
});

function markImageFailed() {
  imageLoadFailed.value = true;
}
</script>

<template>
  <article class="place-card" :class="{ compact }">
    <div class="place-thumb">
      <img
        v-if="imageUrl && !imageLoadFailed"
        :src="imageUrl"
        :alt="`${place.placeName} 장소 이미지`"
        @error="markImageFailed"
      />
      <div v-else class="place-thumb-placeholder" aria-hidden="true">
        <span>{{ placeInitial }}</span>
      </div>
    </div>
    <div class="place-body">
      <strong>{{ place.placeName }}</strong>
      <p>{{ place.region }} · {{ place.district }}</p>
      <small>{{ place.category }}</small>
    </div>
  </article>
</template>
