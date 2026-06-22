<script setup>
import { computed } from 'vue';

const props = defineProps({
  stops: { type: Array, default: () => [] },
});

const GENERIC_NOTE_PATTERNS = [
  /opening hours/i,
  /transit/i,
  /verified sceniK route/i,
  /added to saved route/i,
  /운영\s*시간/,
  /이동편/,
  /이동\s*동선/,
  /방문\s*전.*확인/,
  /출발.*이동/,
  /복귀.*동선/,
];

const WEAK_REASON_PATTERNS = [
  /^촬영지$/,
  /^관광지$/,
  /^검증 장소$/,
  /^장소$/,
  /^spot$/i,
  /^place$/i,
  /verified sceniK route/i,
  /added to saved route/i,
];

const displayStops = computed(() => props.stops.map((stop) => ({
  ...stop,
  displayCategory: meaningfulCategory(stop),
  displayReason: meaningfulStopReason(stop),
  displayNote: meaningfulStopNote(stop),
})));

function cleanText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function isGenericText(value) {
  const text = cleanText(value);
  return !text || GENERIC_NOTE_PATTERNS.some((pattern) => pattern.test(text));
}

function meaningfulCategory(stop) {
  return cleanText(stop.category || stop.placeCategory || stop.type || '장소');
}

function meaningfulStopReason(stop) {
  const reason = cleanText(stop.recommendReason || stop.reason || stop.description);
  const category = meaningfulCategory(stop);
  if (!reason || isGenericText(reason) || WEAK_REASON_PATTERNS.some((pattern) => pattern.test(reason))) return '';
  if (category && reason.toLocaleLowerCase('ko-KR') === category.toLocaleLowerCase('ko-KR')) return '';
  return reason;
}

function meaningfulStopNote(stop) {
  const note = cleanText(stop.travelTip || stop.note || stop.memo || stop.transportTip || stop.stayNote);
  if (isGenericText(note)) return '';
  if (note === meaningfulStopReason(stop)) return '';
  return note;
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
          <small>{{ stop.recommendedTime }}</small>
          <span v-if="stop.displayCategory">{{ stop.displayCategory }}</span>
        </div>
        <strong>{{ stop.placeName || stop.name || '장소' }}</strong>
        <p v-if="stop.displayReason">{{ stop.displayReason }}</p>
        <p v-if="stop.displayNote" class="timeline-note">{{ stop.displayNote }}</p>
      </div>
    </article>
  </div>
</template>
