<script setup>
import { computed } from 'vue';

const props = defineProps({
  stops: { type: Array, default: () => [] },
});

const INTERNAL_TRAVEL_TIP_PATTERN = /missing\s+traveltip\s+for\s+day\s+\d+\.?/i;

const displayStops = computed(() => props.stops.map((stop) => ({
  ...stop,
  displayCategory: meaningfulCategory(stop),
  displayAddress: meaningfulAddress(stop),
  displayTransit: usefulTransitInfo(stop),
})));

function cleanText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function firstText(...values) {
  return values.map(cleanText).find(Boolean) ?? '';
}

function meaningfulTravelTip(stop) {
  const tip = firstText(stop.travelTip, stop.tip, stop.transitTip);
  if (!tip || INTERNAL_TRAVEL_TIP_PATTERN.test(tip)) return '';
  return tip;
}

function meaningfulCategory(stop) {
  return firstText(stop.category, stop.placeCategory, stop.type, '장소');
}

function meaningfulAddress(stop) {
  const address = firstText(stop.address, stop.roadAddress, stop.jibunAddress);
  const placeName = firstText(stop.placeName, stop.name);
  const category = meaningfulCategory(stop);
  if (!address || address === placeName || address === category) return '';
  return address;
}

function numericValue(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number) && number > 0) return number;
  }
  return null;
}

function usefulTransitInfo(stop) {
  const travelTip = meaningfulTravelTip(stop);
  if (travelTip) return travelTip;

  const station = firstText(
    stop.nearestStationName,
    stop.nearestStation,
    stop.stationName,
    stop.transitStation,
    stop.subwayStation,
  );
  const minutes = numericValue(
    stop.nearestStationWalkingMinutes,
    stop.walkingMinutes,
    stop.transitMinutes,
    stop.stationWalkingMinutes,
  );
  const meters = numericValue(
    stop.nearestStationDistanceMeters,
    stop.stationDistanceMeters,
    stop.transitDistanceMeters,
    stop.distanceToStationMeters,
  );
  const closeByTime = minutes != null && minutes <= 30;
  const closeByDistance = meters != null && meters <= 2000;
  if (!closeByTime && !closeByDistance) return '';
  if (station && minutes != null) return `${station}에서 도보 ${Math.round(minutes)}분`;
  if (station && meters != null) return `${station}에서 ${(meters / 1000).toFixed(meters >= 1000 ? 1 : 0)}km`;
  if (station) return station;
  if (minutes != null) return `가까운 대중교통까지 도보 ${Math.round(minutes)}분`;
  if (meters != null) return `가까운 대중교통까지 ${(meters / 1000).toFixed(meters >= 1000 ? 1 : 0)}km`;
  return '';
}
</script>

<template>
  <div class="timeline">
    <article v-for="(stop, index) in displayStops" :key="`${stop.placeId}-${index}`" class="timeline-item">
      <div class="timeline-marker">
        <span>{{ index + 1 }}</span>
      </div>
      <div class="timeline-card">
        <div class="timeline-card__meta">
          <span v-if="stop.displayCategory">{{ stop.displayCategory }}</span>
        </div>
        <strong>{{ stop.placeName || stop.name || '장소' }}</strong>
        <p v-if="stop.displayAddress">{{ stop.displayAddress }}</p>
        <p v-if="stop.displayTransit" class="timeline-note">{{ stop.displayTransit }}</p>
      </div>
    </article>
  </div>
</template>
