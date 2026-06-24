<script setup>
import { useI18n } from 'vue-i18n';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import AiPromptContextSummary from '../components/ai/AiPromptContextSummary.vue';
import AiRunwayProgress from '../components/ai/AiRunwayProgress.vue';
import { generateAiRoute } from '../api/aiApi.js';
import { getUserMessage } from '../api/error.js';
import { getPlaceImageUrl } from '../utils/placeImages.js';
import { useContentStore } from '../stores/contentStore.js';
import { usePlaceStore } from '../stores/placeStore.js';
import { useUiStore } from '../stores/uiStore.js';
import { AI_ROUTE_VALIDATION_USER_MESSAGE, validateAiRoute } from '../adapters/routeValidation.js';
import { formatDateRange, getTripDurationDays } from '../utils/tripDates.js';
import { normalizeCarDays, normalizeTransportModes, transportLabel } from '../utils/transport.js';

const { t } = useI18n();

const router = useRouter();
const contentStore = useContentStore();
const placeStore = usePlaceStore();
const uiStore = useUiStore();
const loadingProgress = ref(0);
const loadingSteps = [
  {
    label: t('autoPass.ui_e64051fd86'),
    detail: t('autoPass.ui_2f367182e1'),
    startAt: 0,
    doneAt: 20,
  },
  {
    label: t('autoPass.ui_433dc97875'),
    detail: t('autoPass.ui_3bc9b971bf'),
    startAt: 20,
    doneAt: 45,
  },
  {
    label: t('autoPass.ui_cf474f1c88'),
    detail: t('autoPass.ui_79529319ed'),
    startAt: 45,
    doneAt: 101,
  },
];
let progressTimerId;
let generationStartTime = 0;
let progressAnimationFrameId;

const MIN_LOADING_DURATION = 2100;
const COMPLETION_DURATION = 650;

const runwayTheme = computed(() => (uiStore.theme === 'dark' ? 'dark' : 'light'));

const activeStepIndex = computed(() => {
  let activeIndex = 0;
  loadingSteps.forEach((step, index) => {
    if (loadingProgress.value >= step.startAt) activeIndex = index;
  });
  return activeIndex;
});

const loadingSummary = computed(() => {
  const selected = selectedContents();
  const title = selected.length > 1 ? t('autoPass.ui_983bd02e18', { value0: selected[0].title, value1: selected.length - 1 }) : selected[0]?.title ?? t('autoPass.ui_4aeafb9db3');
  const duration = getTripDurationDays(uiStore.courseConditions);
  return t('autoPass.ui_5c30f0eb69', { value0: selectedRegionLabel(), value1: duration, value2: title });
});

const loadingStatusText = computed(() => {
  if (loadingProgress.value < 20) return t('autoPass.ui_00fb9fb7de');
  if (loadingProgress.value < 45) return t('autoPass.ui_7a4fa8d7af');
  if (loadingProgress.value < 75) return t('autoPass.ui_974ad1a339');
  if (loadingProgress.value < 100) return t('autoPass.ui_0053c4ba73');
  return t('autoPass.ui_c6b085f270');
});
const loadingContextRows = computed(() => [
  { label: t('autoPass.ui_1745c23c9e'), value: selectedRegionLabel() },
  { label: t('autoPass.ui_a5371dc25c'), value: t('autoPass.ui_43d3a63424', { value0: getTripDurationDays(uiStore.courseConditions) }) },
  { label: t('autoPass.ui_c86dd4bfe3'), value: selectedTransportLabel() },
  { label: t('autoPass.ui_3811c2cccd'), value: selectedTravelStyles().join(', ') || uiStore.courseConditions.style },
  { label: t('autoPass.ui_9eb0d6c311'), value: uiStore.courseConditions.budget },
  { label: t('autoPass.ui_4b0dfbc732'), value: uiStore.courseConditions.hotelAddress?.trim() || t('autoPass.ui_c3bf79c3a1') },
]);

function loadingStepState(index, step) {
  if (loadingProgress.value >= step.doneAt) return 'done';
  if (index === activeStepIndex.value) return 'active';
  return 'waiting';
}

function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function animateProgressTo(target, duration) {
  const start = loadingProgress.value;
  const startTime = performance.now();
  window.cancelAnimationFrame(progressAnimationFrameId);

  return new Promise((resolve) => {
    const tick = (now) => {
      const elapsed = Math.min(1, (now - startTime) / duration);
      const eased = 1 - ((1 - elapsed) ** 3);
      loadingProgress.value = Math.round(start + (target - start) * eased);
      if (elapsed < 1) {
        progressAnimationFrameId = window.requestAnimationFrame(tick);
      } else {
        loadingProgress.value = target;
        resolve();
      }
    };
    progressAnimationFrameId = window.requestAnimationFrame(tick);
  });
}

async function completeLoading() {
  window.clearInterval(progressTimerId);
  const minimumTimeRemaining = Math.max(0, MIN_LOADING_DURATION - (Date.now() - generationStartTime));
  if (minimumTimeRemaining) await wait(minimumTimeRemaining);
  await animateProgressTo(100, COMPLETION_DURATION);
  await wait(140);
}

function selectedTransportModes() {
  return normalizeTransportModes(uiStore.courseConditions.transportModes, uiStore.courseConditions.transport);
}

function selectedCarDays() {
  return normalizeCarDays(uiStore.courseConditions.carDays, getTripDurationDays(uiStore.courseConditions), selectedTransportModes());
}

function selectedTransportLabel() {
  return transportLabel(selectedTransportModes(), selectedCarDays(), getTripDurationDays(uiStore.courseConditions));
}
function selectedContentIds() {
  const ids = Array.isArray(uiStore.selectedContentIds) && uiStore.selectedContentIds.length
    ? uiStore.selectedContentIds
    : [uiStore.selectedContentId].filter(Boolean);
  return [...new Set(ids.filter(Boolean))];
}

function selectedContents() {
  return selectedContentIds().map((contentId) => contentStore.items.find((content) => content.contentId === contentId) ?? {
    contentId,
    title: '\uC120\uD0DD\uD55C K-\uCF58\uD150\uCE20',
  });
}

function selectedTravelStyles() {
  const styles = Array.isArray(uiStore.courseConditions.travelStyles)
    ? uiStore.courseConditions.travelStyles.filter(Boolean)
    : [];
  return styles.length ? styles : [uiStore.courseConditions.style].filter(Boolean);
}

function selectedRegions() {
  const regions = Array.isArray(uiStore.courseConditions.regions)
    ? uiStore.courseConditions.regions.filter(Boolean)
    : [];
  return regions.length ? regions : [uiStore.courseConditions.region].filter(Boolean);
}

function selectedRegionLabel(separator = ', ') {
  return selectedRegions().join(separator) || t('autoPass.ui_6ae0fbb904');
}

function candidateFromPlace(place, selectedContent) {
  return {
    placeId: place.placeId,
    name: place.placeName ?? place.name,
    region: place.region,
    category: place.category,
    address: place.address,
    latitude: place.latitude,
    longitude: place.longitude,
    relatedContentId: selectedContent?.contentId ?? 'regional-verified',
    relatedContentTitle: selectedContent?.title ?? '\uc9c0\uc5ed \uc2e4\uc81c \uc7a5\uc18c',
    sceneDescription: place.description ?? '\uc2e4\uc81c \uc7a5\uc18c \ub370\uc774\ud130\uc785\ub2c8\ub2e4.',
    verified: place.verified !== false,
    imageUrl: getPlaceImageUrl(place),
  };
}

async function collectCandidatePlaces(selected) {
  const byPlaceId = new Map();
  const results = await Promise.allSettled(selected.map(async (selectedContent) => ({
    selectedContent,
    places: await contentStore.getRelatedPlaces(selectedContent.contentId),
  })));
  results
    .filter((result) => result.status === 'fulfilled')
    .forEach(({ value }) => {
      value.places.forEach((place) => {
        if (!place || place.verified === false) return;
        const candidate = candidateFromPlace(place, value.selectedContent);
        const previous = byPlaceId.get(candidate.placeId);
        byPlaceId.set(candidate.placeId, previous
          ? {
              ...previous,
              relatedContentTitle: `${previous.relatedContentTitle}, ${value.selectedContent.title}`,
              sceneDescription: `${previous.sceneDescription} / ${candidate.sceneDescription}`,
            }
          : candidate);
      });
    });
  return [...byPlaceId.values()];
}

async function resolveCandidatePlaces(selected, preferredRegions, durationDays) {
  const candidates = await collectCandidatePlaces(selected);
  const exact = candidates.filter((place) => preferredRegions.includes(place.region));
  if (exact.length) {
    return { region: preferredRegions.join(','), regions: preferredRegions, candidatePlaces: exact };
  }

  return { region: preferredRegions.join(','), regions: preferredRegions, candidatePlaces: [] };
}

async function generateRoute() {
  await Promise.all([
    contentStore.items.length ? Promise.resolve() : contentStore.load(),
    placeStore.items.length ? Promise.resolve() : placeStore.load(),
  ]);
  const selected = selectedContents();
  if (!selected.length) {
    uiStore.notify(t('autoPass.ui_81d7f0a104'));
    router.push('/ai');
    return;
  }
  const requestedDuration = getTripDurationDays(uiStore.courseConditions);
  uiStore.courseConditions.duration = requestedDuration;
  const primaryContent = selected[0];
  const contentIds = selected.map((content) => content.contentId);
  const travelStyles = selectedTravelStyles();
  const regions = selectedRegions();
  const selectedContentTitle = selected.map((content) => content.title).join(' · ');
  const transportModes = selectedTransportModes();
  const carDays = selectedCarDays();
  const transport = selectedTransportLabel();

  try {
    const backendRoute = await generateAiRoute({
      contentId: primaryContent.contentId,
      contentIds,
      region: regions.join(','),
      regions,
      durationDays: requestedDuration,
      startDate: uiStore.courseConditions.startDate,
      endDate: uiStore.courseConditions.endDate,
      dateRangeLabel: formatDateRange(uiStore.courseConditions),
      transport,
      transportModes,
      carDays,
      companion: uiStore.courseConditions.companion,
      style: travelStyles.join(', '),
      travelStyles,
      budgetMin: uiStore.courseConditions.budgetMin,
      budgetMax: uiStore.courseConditions.budgetMax,
      budget: uiStore.courseConditions.budget,
      hotelAddress: uiStore.courseConditions.hotelAddress,
    });
    const validation = validateAiRoute(backendRoute, backendRoute.candidatePlaces, {
      region: regions.join(','),
      regions,
      durationDays: backendRoute.durationDays,
      strictRegion: true,
    });
    if (!validation.ok) {
      console.warn('AI route validation failed', validation.errors);
      throw new Error(AI_ROUTE_VALIDATION_USER_MESSAGE);
    }
    uiStore.generatedRoute = {
      ...backendRoute,
            title: `${selectedContentTitle} ${selectedRegionLabel('?')} ${(travelStyles[0] ?? uiStore.courseConditions.style ?? '\uac10\uc131 \uc5ec\ud589').replace(' \uc5ec\ud589', '')} \uc5ec\ud589 \ucf54\uc2a4`,
      contentTitle: selectedContentTitle,
      regions: backendRoute.regions ?? regions,
      region: backendRoute.region ?? regions.join(','),
      requestedDurationDays: requestedDuration,
      startDate: backendRoute.startDate ?? uiStore.courseConditions.startDate,
      endDate: backendRoute.endDate ?? uiStore.courseConditions.endDate,
      transport: backendRoute.transport ?? transport,
      transportModes,
      carDays,
      companion: backendRoute.companion ?? uiStore.courseConditions.companion,
      style: backendRoute.style ?? travelStyles.join(', '),
      travelStyles: backendRoute.travelStyles ?? travelStyles,
      budgetMin: backendRoute.budgetMin ?? uiStore.courseConditions.budgetMin,
      budgetMax: backendRoute.budgetMax ?? uiStore.courseConditions.budgetMax,
      budget: backendRoute.budget ?? uiStore.courseConditions.budget,
      hotelAddress: backendRoute.hotelAddress ?? uiStore.courseConditions.hotelAddress,
    };
    uiStore.persist();
    await completeLoading();
    router.push('/ai/result');
    return;
  } catch (error) {
    const message = getUserMessage(error, t('autoPass.ui_761f414bf0'));
    if (import.meta.env.VITE_ENABLE_LOCAL_AI_FALLBACK !== 'true') {
      uiStore.routeError = message;
      uiStore.notify(message);
      router.push('/ai/conditions');
      return;
    }
    // Local deterministic route is opt-in for offline demos only.
  }

  const resolved = await resolveCandidatePlaces(selected, regions, requestedDuration);
  const dayCount = Math.max(1, Math.min(requestedDuration, resolved.candidatePlaces.length));
  const contentTitle = selected.map((content) => content.title).join(' · ');
  const dateRangeLabel = formatDateRange(uiStore.courseConditions);
  const styleLabel = (travelStyles[0] ?? '\uac10\uc131 \uc5ec\ud589').replace(' \uc5ec\ud589', '');
  const durationLabel = dayCount > 1 ? `${dayCount - 1}\ubc15 ${dayCount}\uc77c` : '1\uc77c \ucf54\uc2a4';
  const request = {
    contentId: primaryContent.contentId,
    region: resolved.region,
    regions: resolved.regions,
    durationDays: dayCount,
  };
  const candidatePlaces = resolved.candidatePlaces;
  const groups = Array.from({ length: dayCount }, () => []);
  candidatePlaces.slice(0, Math.max(dayCount, 3)).forEach((place, index) => {
    groups[index % dayCount].push(place);
  });
  const route = {
    routeId: `route-${Date.now()}`,
    title: `${contentTitle} ${request.region} ${styleLabel} ${durationLabel}`,
    summary: `${dateRangeLabel} \uc77c\uc815\uc5d0 \ub9de\ucdb0 ${contentTitle}\uc640 \uac19\uc740 \uc9c0\uc5ed\uc758 \uc2e4\uc81c \uc7a5\uc18c\ub97c \uc5f0\uacb0\ud55c ${dayCount}\uc77c \uc5ec\ud589 \ucf54\uc2a4\uc785\ub2c8\ub2e4.`,
    contentId: primaryContent.contentId,
    contentIds,
    contentTitle,
    region: request.region,
    regions: request.regions,
    durationDays: dayCount,
    requestedDurationDays: requestedDuration,
    startDate: uiStore.courseConditions.startDate,
    endDate: uiStore.courseConditions.endDate,
    dateRangeLabel,
    transport,
    transportModes,
    carDays,
    companion: uiStore.courseConditions.companion,
    style: travelStyles.join(', '),
    travelStyles,
    budgetMin: uiStore.courseConditions.budgetMin,
    budgetMax: uiStore.courseConditions.budgetMax,
    budget: uiStore.courseConditions.budget,
    hotelAddress: uiStore.courseConditions.hotelAddress,
    trustMessage: '\ub4f1\ub85d\ub41c \uc2e4\uc81c \uc7a5\uc18c \ub370\uc774\ud130\ub9cc \uc0ac\uc6a9\ud588\uc2b5\ub2c8\ub2e4. \uc784\uc758 \uc7a5\uc18c\ub294 \ud3ec\ud568\ud558\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4.',
    candidatePlaces,
    days: groups.map((group, dayIndex) => ({
      dayNumber: dayIndex + 1,
      estimatedTravelTime: dayIndex === 0 ? '\uc774\ub3d9 \uc57d 58\ubd84' : '\uc774\ub3d9 \uc57d 74\ubd84',
      places: group.map((place, placeIndex) => ({
        placeId: place.placeId,
        placeName: place.name,
        dayNumber: dayIndex + 1,
        visitOrder: placeIndex + 1,
        recommendedTime: placeIndex === 0 ? '10:00' : placeIndex === 1 ? '14:00' : '17:30',
        reason: place.category || '\ucd2c\uc601\uc9c0',
        travelTip: uiStore.courseConditions.hotelAddress
          ? `${placeIndex === 0 ? `\uc219\uc18c(${uiStore.courseConditions.hotelAddress})\uc5d0\uc11c \ucd9c\ubc1c\ud558\ub294 \ub3d9\uc120\uc744 \ucc38\uace0\ud558\uc138\uc694. ` : ''}${place.region} \uc774\ub3d9 \ub3d9\uc120\uc744 \ud655\uc778\ud558\uace0 \uc6b4\uc601 \uc2dc\uac04\uc744 \ubc29\ubb38 \uc804 \ub2e4\uc2dc \ud655\uc778\ud558\uc138\uc694.${placeIndex === group.length - 1 ? '\uc77c\uc815 \ud6c4 \uc219\uc18c \ubcf5\uadc0 \uc2dc\uac04\uc744 \ud568\uaed8 \ud655\uc778\ud558\uc138\uc694.' : ''}`
          : `${place.region} \uc774\ub3d9 \ub3d9\uc120\uc744 \ud655\uc778\ud558\uace0 \uc6b4\uc601 \uc2dc\uac04\uc744 \ubc29\ubb38 \uc804 \ub2e4\uc2dc \ud655\uc778\ud558\uc138\uc694.`,
      })),
    })),
  };
  const validation = validateAiRoute(route, candidatePlaces, request);
  if (!validation.ok) {
    uiStore.notify(validation.errors[0]);
    router.push('/ai/conditions');
    return;
  }
  uiStore.generatedRoute = route;
  uiStore.persist();
  await completeLoading();
  router.push('/ai/result');
}

onMounted(() => {
  generationStartTime = Date.now();
  progressTimerId = window.setInterval(() => {
    const elapsed = Date.now() - generationStartTime;
    let target = 0;
    if (elapsed < 650) target = 20 * (elapsed / 650);
    else if (elapsed < 1600) target = 20 + 25 * ((elapsed - 650) / 950);
    else if (elapsed < 3400) target = 45 + 30 * ((elapsed - 1600) / 1800);
    else if (elapsed < 5600) target = 75 + 17 * ((elapsed - 3400) / 2200);
    else target = Math.min(95, 92 + (elapsed - 5600) / 6000);
    loadingProgress.value = Math.max(loadingProgress.value, Math.floor(target));
  }, 120);
  void generateRoute();
});

onBeforeUnmount(() => {
  window.clearInterval(progressTimerId);
  window.cancelAnimationFrame(progressAnimationFrameId);
});
</script>

<template>
  <AppLayout :title="t('autoPass.ui_16602ec3d5')" back hide-bottom>
    <section class="loading-screen" :class="{ 'loading-screen--light': runwayTheme === 'light' }">
      <AiRunwayProgress :progress="loadingProgress" :theme="runwayTheme" />

      <div class="loading-copy">
        <span>{{ loadingSummary }}</span>
        <h1>{{ t('autoPass.ui_f8441947e8') }}</h1>
        <p>{{ loadingStatusText }}</p>
      </div>

      <AiPromptContextSummary compact :title="t('autoPass.ui_4afb91df58')" :rows="loadingContextRows" />

      <ol class="loading-steps" :aria-label="t('autoPass.ui_5c1a55113a')">
        <li
          v-for="(step, index) in loadingSteps"
          :key="step.label"
          :class="`is-${loadingStepState(index, step)}`"
        >
          <b aria-hidden="true">
            <svg v-if="loadingStepState(index, step) === 'done'" viewBox="0 0 16 16">
              <path d="M3.4 8.1 6.4 11l6.2-6.4" />
            </svg>
          </b>
          <span>
            <strong>{{ step.label }}</strong>
            <small>{{ step.detail }}</small>
          </span>
        </li>
      </ol>
    </section>
  </AppLayout>
</template>
