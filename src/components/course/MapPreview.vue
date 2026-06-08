<script setup>
defineProps({
  routePlaces: { type: Array, default: () => [] },
});
</script>

<template>
  <div class="map-preview">
    <svg viewBox="0 0 320 180" role="img" aria-label="지도 미리보기">
      <path d="M30 132 C 88 34, 128 160, 178 72 S 250 38, 292 116" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-dasharray="10 8" />
    </svg>
    <button
      v-for="(place, index) in routePlaces.slice(0, 5)"
      :key="place.placeId"
      class="map-pin"
      :style="{ left: `${16 + index * 17}%`, top: `${62 - (index % 2) * 22}%` }"
    >
      {{ index + 1 }}
    </button>
    <span class="map-label">지도 API 없이 제공되는 경로 미리보기</span>
  </div>
</template>
