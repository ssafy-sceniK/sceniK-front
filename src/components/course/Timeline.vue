<script setup>
defineProps({
  stops: { type: Array, default: () => [] },
});
</script>

<template>
  <div class="timeline">
    <article v-for="(stop, index) in stops" :key="`${stop.placeId}-${index}`" class="timeline-item">
      <div class="timeline-marker">
        <span>{{ index + 1 }}</span>
      </div>
      <div class="timeline-card">
        <small>{{ stop.recommendedTime }}</small>
        <strong>{{ stop.placeName }}</strong>
        <p>{{ stop.reason }}</p>
        <div class="tag-row">
          <span>{{ stop.travelTip }}</span>
        </div>
      </div>
    </article>
  </div>
</template>
