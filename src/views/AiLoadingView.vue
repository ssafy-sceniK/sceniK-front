<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import { generateAiRoute } from '../api/aiApi.js';
import { getUserMessage } from '../api/error.js';
import { useContentStore } from '../stores/contentStore.js';
import { usePlaceStore } from '../stores/placeStore.js';
import { useUiStore } from '../stores/uiStore.js';
import { AI_ROUTE_VALIDATION_USER_MESSAGE, validateAiRoute } from '../adapters/routeValidation.js';
import { formatDateRange, getTripDurationDays } from '../utils/tripDates.js';

const router = useRouter();
const contentStore = useContentStore();
const placeStore = usePlaceStore();
const uiStore = useUiStore();
const loadingProgress = ref(8);
const loadingSteps = [
  {
    label: '촬영지 데이터 검색',
    detail: '검증된 실제 장소 후보를 확인하고 있어요.',
    startAt: 0,
    doneAt: 34,
  },
  {
    label: '이동 동선 최적화',
    detail: '일정과 교통 조건에 맞춰 순서를 조정하고 있어요.',
    startAt: 34,
    doneAt: 70,
  },
  {
    label: '추천 코스 구성',
    detail: '방문 시간, 이유, 여행 팁을 정리하고 있어요.',
    startAt: 70,
    doneAt: 101,
  },
];
let progressTimerId;
let routeTimerId;
let finishTimerId;

const loadingProgressStyle = computed(() => ({
  '--loading-angle': `${Math.round(loadingProgress.value * 3.6)}deg`,
}));

const activeStepIndex = computed(() => {
  let activeIndex = 0;
  loadingSteps.forEach((step, index) => {
    if (loadingProgress.value >= step.startAt) activeIndex = index;
  });
  return activeIndex;
});

const loadingSummary = computed(() => {
  const selected = selectedContents();
  const title = selected.length > 1 ? `${selected[0].title} 외 ${selected.length - 1}개` : selected[0]?.title ?? '선택한 콘텐츠';
  const duration = getTripDurationDays(uiStore.courseConditions);
  return `${uiStore.courseConditions.region || '선택 지역'} ${duration}일 코스 · ${title}`;
});

const loadingStatusText = computed(() => loadingSteps[activeStepIndex.value].detail);

function loadingStepState(index, step) {
  if (loadingProgress.value >= step.doneAt) return 'done';
  if (index === activeStepIndex.value) return 'active';
  return 'waiting';
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
    title: contentId,
  });
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
    relatedContentTitle: selectedContent?.title ?? '지역 실제 장소',
    sceneDescription: place.description ?? '실제 장소 데이터입니다.',
    verified: place.verified !== false,
    imageUrl: place.imageUrl,
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

function makeRegionalCandidate(place, selected) {
  const relatedContent = selected.find((content) => place.relatedContentIds?.includes(content.contentId)
    || place.relatedContents?.some((item) => item.contentId === content.contentId)) ?? selected[0];
  return candidateFromPlace(place, relatedContent);
}

async function resolveCandidatePlaces(selected, preferredRegion, durationDays) {
  const candidates = await collectCandidatePlaces(selected);
  const groupsByRegion = candidates.reduce((acc, place) => {
    if (!acc.has(place.region)) acc.set(place.region, []);
    acc.get(place.region).push(place);
    return acc;
  }, new Map());
  const exact = groupsByRegion.get(preferredRegion) ?? [];
  const targetCount = Math.max(6, durationDays * 2);
  const exactIds = new Set(exact.map((place) => place.placeId));
  const regionalFallback = placeStore.items
    .filter((place) => place.verified !== false && place.region === preferredRegion && !exactIds.has(place.placeId))
    .slice(0, Math.max(0, targetCount - exact.length))
    .map((place) => makeRegionalCandidate(place, selected));

  if (exact.length || regionalFallback.length) {
    return { region: preferredRegion, candidatePlaces: [...exact, ...regionalFallback] };
  }

  const [region, candidatePlaces] = [...groupsByRegion.entries()]
    .sort((a, b) => b[1].length - a[1].length)[0] ?? [preferredRegion, exact];

  return { region, candidatePlaces };
}

async function generateRoute() {
  await Promise.all([
    contentStore.items.length ? Promise.resolve() : contentStore.load(),
    placeStore.items.length ? Promise.resolve() : placeStore.load(),
  ]);
  const selected = selectedContents();
  if (!selected.length) {
    uiStore.notify('AI 코스를 만들 콘텐츠를 먼저 선택해주세요.');
    router.push('/ai');
    return;
  }
  const requestedDuration = getTripDurationDays(uiStore.courseConditions);
  uiStore.courseConditions.duration = requestedDuration;
  const primaryContent = selected[0];
  const contentIds = selected.map((content) => content.contentId);

  try {
    const backendRoute = await generateAiRoute({
      contentId: primaryContent.contentId,
      contentIds,
      region: uiStore.courseConditions.region,
      durationDays: requestedDuration,
      startDate: uiStore.courseConditions.startDate,
      endDate: uiStore.courseConditions.endDate,
      transport: uiStore.courseConditions.transport,
      companion: uiStore.courseConditions.companion,
      style: uiStore.courseConditions.style,
      budgetMin: uiStore.courseConditions.budgetMin,
      budgetMax: uiStore.courseConditions.budgetMax,
    });
    const validation = validateAiRoute(backendRoute, backendRoute.candidatePlaces, {
      region: backendRoute.region,
      durationDays: backendRoute.durationDays,
    });
    if (!validation.ok) {
      console.warn('AI route validation failed', validation.errors);
      throw new Error(AI_ROUTE_VALIDATION_USER_MESSAGE);
    }
    uiStore.generatedRoute = {
      ...backendRoute,
      requestedDurationDays: requestedDuration,
      startDate: backendRoute.startDate ?? uiStore.courseConditions.startDate,
      endDate: backendRoute.endDate ?? uiStore.courseConditions.endDate,
      transport: backendRoute.transport ?? uiStore.courseConditions.transport,
      companion: backendRoute.companion ?? uiStore.courseConditions.companion,
      style: backendRoute.style ?? uiStore.courseConditions.style,
      budgetMin: backendRoute.budgetMin ?? uiStore.courseConditions.budgetMin,
      budgetMax: backendRoute.budgetMax ?? uiStore.courseConditions.budgetMax,
      budget: backendRoute.budget ?? uiStore.courseConditions.budget,
    };
    uiStore.persist();
    router.push('/ai/result');
    return;
  } catch (error) {
    const message = getUserMessage(error, 'AI 코스 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    if (import.meta.env.VITE_ENABLE_LOCAL_AI_FALLBACK !== 'true') {
      uiStore.routeError = message;
      uiStore.notify(message);
      router.push('/ai/conditions');
      return;
    }
    // Local deterministic route is opt-in for offline demos only.
  }

  const resolved = await resolveCandidatePlaces(selected, uiStore.courseConditions.region, requestedDuration);
  const dayCount = Math.max(1, Math.min(requestedDuration, resolved.candidatePlaces.length));
  const contentTitle = selected.length > 1 ? `${primaryContent.title} 외 ${selected.length - 1}개` : primaryContent.title;
  const dateRangeLabel = formatDateRange(uiStore.courseConditions);
  const styleLabel = (uiStore.courseConditions.style ?? '감성 여행').replace(' 여행', '');
  const durationLabel = dayCount > 1 ? `${dayCount - 1}박 ${dayCount}일` : '1일 코스';
  const request = {
    contentId: primaryContent.contentId,
    region: resolved.region,
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
    summary: `${dateRangeLabel} 일정에 맞춰 ${contentTitle}와 같은 지역의 실제 장소를 연결한 ${dayCount}일 여행 코스입니다.`,
    contentId: primaryContent.contentId,
    contentIds,
    contentTitle,
    region: request.region,
    durationDays: dayCount,
    requestedDurationDays: requestedDuration,
    startDate: uiStore.courseConditions.startDate,
    endDate: uiStore.courseConditions.endDate,
    dateRangeLabel,
    transport: uiStore.courseConditions.transport,
    companion: uiStore.courseConditions.companion,
    style: uiStore.courseConditions.style,
    budgetMin: uiStore.courseConditions.budgetMin,
    budgetMax: uiStore.courseConditions.budgetMax,
    budget: uiStore.courseConditions.budget,
    trustMessage: '등록된 실제 장소 데이터만 사용했습니다. 임의 장소는 포함하지 않습니다.',
    candidatePlaces,
    days: groups.map((group, dayIndex) => ({
      dayNumber: dayIndex + 1,
      estimatedTravelTime: dayIndex === 0 ? '이동 약 58분' : '이동 약 74분',
      places: group.map((place, placeIndex) => ({
        placeId: place.placeId,
        placeName: place.name,
        dayNumber: dayIndex + 1,
        visitOrder: placeIndex + 1,
        recommendedTime: placeIndex === 0 ? '10:00' : placeIndex === 1 ? '14:00' : '17:30',
        reason: `${place.relatedContentTitle}의 장면 맥락과 ${uiStore.courseConditions.style} 조건에 잘 맞는 실제 장소입니다.`,
        travelTip: `${place.region} 이동 동선을 확인하고 운영 시간을 방문 전 다시 확인하세요.`,
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
  router.push('/ai/result');
}

onMounted(() => {
  progressTimerId = window.setInterval(() => {
    const step = loadingProgress.value < 62 ? 4 : 2;
    loadingProgress.value = Math.min(96, loadingProgress.value + step);
  }, 80);
  routeTimerId = window.setTimeout(() => {
    loadingProgress.value = 100;
    finishTimerId = window.setTimeout(generateRoute, 220);
  }, 1800);
});

onBeforeUnmount(() => {
  window.clearInterval(progressTimerId);
  window.clearTimeout(routeTimerId);
  window.clearTimeout(finishTimerId);
});
</script>

<template>
  <AppLayout title="AI 코스 생성" back hide-bottom>
    <section class="loading-screen" :style="loadingProgressStyle">
      <div
        class="loading-orbit"
        role="progressbar"
        aria-label="AI 코스 생성 진행도"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="loadingProgress"
      >
        <span class="loading-orbit__track" aria-hidden="true"></span>
        <strong>{{ loadingProgress }}%</strong>
      </div>

      <div class="loading-copy">
        <span>{{ loadingSummary }}</span>
        <h1>AI가 코스를 생성하고 있어요</h1>
        <p>{{ loadingStatusText }}</p>
      </div>

      <ol class="loading-steps" aria-label="AI 코스 생성 단계">
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
