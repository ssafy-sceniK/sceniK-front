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
const placeInitial = computed(() => displayPlace.value?.placeName?.trim?.().slice(0, 1) || 'P');
const placeMeta = computed(() => [displayPlace.value?.region, displayPlace.value?.district].filter(Boolean).join(' / '));

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
        :alt="t('place.detail.imageAlt', { name: displayPlace.placeName })"
        @error="markImageFailed"
      />
      <div v-else class="place-thumb-placeholder" aria-hidden="true">
        <span>{{ placeInitial }}</span>
      </div>
    </div>
    <div class="place-body">
      <strong>{{ displayPlace.placeName }}</strong>
      <p>{{ placeMeta }}</p>
      <small>{{ displayPlace.category }}</small>
    </div>
  </article>
</template>