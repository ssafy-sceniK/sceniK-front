<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { localizePlace } from '../../i18n/systemContent.js';

const props = defineProps({
  place: { type: Object, required: true },
  compact: { type: Boolean, default: false },
});

const { locale, t } = useI18n();
const imageLoadFailed = ref(false);
const imageUrl = computed(() => props.place?.imageUrl || '');
const displayPlace = computed(() => localizePlace(props.place, locale.value, t));
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
        :alt="`${place.placeName} place image`"
        @error="markImageFailed"
      />
      <div v-else class="place-thumb-placeholder" aria-hidden="true">
        <span>{{ placeInitial }}</span>
      </div>
    </div>
    <div class="place-body">
      <strong>{{ displayPlace.placeName }}</strong>
      <p>{{ displayPlace.region }} · {{ place.district }}</p>
      <small>{{ displayPlace.category }}</small>
    </div>
  </article>
</template>