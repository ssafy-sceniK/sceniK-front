<script setup>
defineProps({
  place: { type: Object, required: true },
  compact: { type: Boolean, default: false },
});

function useFallbackImage(event) {
  if (event.currentTarget.dataset.fallbackApplied) return;
  event.currentTarget.dataset.fallbackApplied = 'true';
  event.currentTarget.src = '/images/seoul-street.jpg';
}
</script>

<template>
  <article class="place-card" :class="{ compact }">
    <div class="place-thumb">
      <img :src="place.imageUrl" :alt="place.placeName" @error="useFallbackImage" />
      <span v-if="place.verified" class="badge verified">검증</span>
    </div>
    <div class="place-body">
      <strong>{{ place.placeName }}</strong>
      <p>{{ place.region }} · {{ place.district }}</p>
      <small>{{ place.category }}</small>
    </div>
  </article>
</template>
