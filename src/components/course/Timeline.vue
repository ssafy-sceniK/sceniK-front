<script setup>
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';

const { t } = useI18n();

const props = defineProps({
  stops: { type: Array, default: () => [] },
  showTransitNotes: { type: Boolean, default: true },
});

const emit = defineEmits(['select']);

const INTERNAL_TRAVEL_TIP_PATTERN = /missing\s+traveltip\s+for\s+day\s+\d+\.?/i;

const displayStops = computed(() => props.stops.map((stop) => ({
  ...stop,
  displayCategory: meaningfulCategory(stop),
  displayAddress: meaningfulAddress(stop),
  displayTransit: props.showTransitNotes ? usefulTransitInfo(stop) : '',
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
  return firstText(stop.category, stop.placeCategory, stop.type, t('course.cleanup.k5b847da9ce'));
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
  if (station && minutes != null) return t('course.cleanup.ke32fa1e2e6', { value0: station, value1: Math.round(minutes) });
  if (station && meters != null) return t('course.cleanup.k6905c32f98', { value0: station, value1: (meters / 1000).toFixed(meters >= 1000 ? 1 : 0) });
  if (station) return station;
  if (minutes != null) return t('course.cleanup.k6148e18841', { value0: Math.round(minutes) });
  if (meters != null) return t('course.cleanup.k2d6702cdf6', { value0: (meters / 1000).toFixed(meters >= 1000 ? 1 : 0) });
  return '';
}
</script>

<template>
  <div class="timeline">
    <article v-for="(stop, index) in displayStops" :key="`${stop.placeId}-${index}`" class="timeline-item">
      <div class="timeline-marker">
        <span>{{ index + 1 }}</span>
      </div>
      <button type="button" class="timeline-card timeline-card--selectable" @click="emit('select', stop)">
        <div class="timeline-card__meta">
          <span v-if="stop.displayCategory">{{ stop.displayCategory }}</span>
        </div>
        <strong>{{ stop.placeName || stop.name || t('course.cleanup.k5b847da9ce') }}</strong>
        <p v-if="stop.displayAddress">{{ stop.displayAddress }}</p>
        <p v-if="stop.displayTransit" class="timeline-note">{{ stop.displayTransit }}</p>
      </button>
    </article>
  </div>
</template>
