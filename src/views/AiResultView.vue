<script setup>
import { useI18n } from 'vue-i18n';
import { computed, nextTick, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { AnimatePresence, motion } from 'motion-v';
import BaseButton from '../components/common/BaseButton.vue';
import EmptyState from '../components/common/EmptyState.vue';
import KakaoRouteMap from '../components/course/KakaoRouteMap.vue';
import CourseSaveStatusPanel from '../components/course/CourseSaveStatusPanel.vue';
import { useUiStore } from '../stores/uiStore.js';
import { formatDateRange, getTripDurationDays } from '../utils/tripDates.js';
import { motionVariants } from '../utils/motion.js';
import { buildCourseShareUrl, copyCourseUrl, resolvedCourseShareRouteId, shareCourseUrl } from '../utils/courseShare.js';

const AUTO_SAVE_RECORDS_KEY = 'scenik-ai-course-auto-save-records';

const { t } = useI18n();

const router = useRouter();
const uiStore = useUiStore();
const route = computed(() => uiStore.generatedRoute);
const selectedDay = ref(1);
const showActionMenu = ref(false);
const showShareSheet = ref(false);
const savingRoute = ref(false);
const saveError = ref('');
const saveNotice = ref(null);
const autoSaveGenerationKey = ref('');
const resultMapSection = ref(null);
const selectedMapPlaceId = ref('');
const routeCandidateMap = computed(() => new Map((route.value?.candidatePlaces ?? [])
  .map((place) => [place.placeId, place])));
const selectedRegions = computed(() => {
  const regions = Array.isArray(route.value?.regions) && route.value.regions.length
    ? route.value.regions
    : String(route.value?.region || uiStore.courseConditions.region || '').split(/[,.·]/).map((region) => region.trim()).filter(Boolean);
  return regions.length ? regions : ['\uc11c\uc6b8'];
});
const selectedRegion = computed(() => selectedRegions.value.join(','));
const selectedRegionLabel = computed(() => selectedRegions.value.join(', '));
const routePlaces = computed(() => (route.value?.days ?? []).flatMap((day) => day.places ?? []).map((stop) => ({
  ...routeCandidateMap.value.get(stop.placeId),
  ...stop,
  placeName: stop.placeName ?? stop.name ?? routeCandidateMap.value.get(stop.placeId)?.placeName ?? routeCandidateMap.value.get(stop.placeId)?.name,
})).filter((stop) => isSelectedRegionPlace(stop)) ?? []);
const stops = computed(() => (route.value?.days.find((day) => day.dayNumber === selectedDay.value)?.places ?? []).map((stop) => ({
  ...routeCandidateMap.value.get(stop.placeId),
  ...stop,
  placeName: stop.placeName ?? stop.name ?? routeCandidateMap.value.get(stop.placeId)?.placeName ?? routeCandidateMap.value.get(stop.placeId)?.name,
})).filter((stop) => isSelectedRegionPlace(stop)));
const dayTabs = computed(() => route.value?.days.map((day) => day.dayNumber) ?? []);
const placeCount = computed(() => routePlaces.value.length);
const resultMeta = computed(() => {
  if (!route.value) return '';
  return [
    t('autoPass.ui_d90bebf09a', { value0: placeCount.value }),
    route.value.transport,
    route.value.companion ?? uiStore.courseConditions.companion,
  ].filter(Boolean).join(' · ');
});
const shareSummary = computed(() => {
  if (!route.value) return '';
  return t('autoPass.ui_0c07a50b2a', { value0: placeCount.value, value1: route.value.durationDays });
});
const resultShareRouteId = computed(() => {
  return resolvedCourseShareRouteId(route.value?.routeId);
});
const resultShareUrl = computed(() => {
  return buildCourseShareUrl(router, resultShareRouteId.value);
});
const resultShareDisabled = computed(() => savingRoute.value || !resultShareUrl.value);
const saveStatusRows = computed(() => {
  if (!route.value) return [];
  return [
    { label: t('autoPass.ui_6efb3787d7'), value: t('autoPass.ui_a7e167dab3', { value0: placeCount.value }) },
    { label: t('autoPass.ui_11b6b0909a'), value: contentLabel.value },
    { label: t('autoPass.ui_1745c23c9e'), value: selectedRegionLabel.value },
    { label: t('autoPass.ui_a54f5476bb'), value: travelPeriodLabel.value },
    { label: t('autoPass.ui_1244ec5bbe'), value: route.value.transport ?? uiStore.courseConditions.transport },
    { label: t('autoPass.ui_9eb0d6c311'), value: route.value.budget ?? uiStore.courseConditions.budget },
    { label: t('autoPass.ui_3811c2cccd'), value: themeLabel.value },
    { label: t('autoPass.ui_4b0dfbc732'), value: lodgingInfo.value ? lodgingInfo.value.name : t('autoPass.ui_6be15113d4') },
  ];
});
const contentLabel = computed(() => {
  if (!route.value) return '';
  if (route.value.contentTitle) return route.value.contentTitle;
  const titles = (route.value.candidatePlaces ?? []).map((place) => place.relatedContentTitle).filter(Boolean);
  return [...new Set(titles)].join(', ') || t('autoPass.ui_11b6b0909a');
});
const themeLabel = computed(() => {
  const styles = Array.isArray(route.value?.travelStyles) && route.value.travelStyles.length
    ? route.value.travelStyles
    : String(route.value?.style ?? uiStore.courseConditions.style ?? '').split(/[,.·]/).map((style) => style.trim()).filter(Boolean);
  return styles.join(', ') || t('autoPass.ui_97e1ab6ad1');
});
const travelPeriodLabel = computed(() => {
  const source = {
    startDate: route.value?.startDate ?? uiStore.courseConditions.startDate,
    endDate: route.value?.endDate ?? uiStore.courseConditions.endDate,
  };
  const range = route.value?.dateRangeLabel || formatDateRange(source);
  const days = route.value?.requestedDurationDays || getTripDurationDays(source) || route.value?.durationDays;
  return t('autoPass.ui_9631189e07', { value0: range, value1: days });
});
const lodgingInfo = computed(() => {
  const address = route.value?.hotelAddress?.trim() || uiStore.courseConditions.hotelAddress?.trim();
  if (!address) return null;
  const tokens = address.split(/\s+/).filter(Boolean);
  const name = tokens.slice(-2).join(' ') || t('autoPass.ui_593d670219');
  return { name, address };
});
const isSaved = computed(() => Boolean(route.value?.routeId && uiStore.savedCourses.some((course) => course.routeId === route.value.routeId)));
const generationRouteId = computed(() => route.value?.generationId || (String(route.value?.routeId ?? '').startsWith('gen-') ? route.value.routeId : ''));
const isGeneratedUnsavedRoute = computed(() => Boolean(route.value && generationRouteId.value && route.value.routeId === generationRouteId.value));
const isPersistedSavedRoute = computed(() => Boolean(route.value?.routeId && !isGeneratedUnsavedRoute.value && (route.value.createdAt || String(route.value.routeId).startsWith('route-'))));
const isResultSaved = computed(() => isSaved.value || isPersistedSavedRoute.value);
const resultActionLabel = computed(() => {
  if (saveError.value) return t('aiCourse.result.retrySave');
  if (savingRoute.value) return t('aiCourse.result.savingButton');
  return t('aiCourse.result.done');
});
const resultActionDisabled = computed(() => savingRoute.value || (!saveError.value && !isResultSaved.value));
const routePlaceIds = computed(() => [...new Set(routePlaces.value.map((place) => place.placeId).filter(Boolean))]);
const allRoutePlacesTracked = computed(() => Boolean(routePlaceIds.value.length)
  && routePlaceIds.value.every((placeId) => uiStore.plannedVisits.includes(placeId) || uiStore.completedVisits.includes(placeId)));
const allRoutePlacesCompleted = computed(() => Boolean(routePlaceIds.value.length)
  && routePlaceIds.value.every((placeId) => uiStore.completedVisits.includes(placeId)));
const bulkVisitActionDisabled = computed(() => !routePlaceIds.value.length);
const bulkVisitActionLabel = computed(() => {
  if (allRoutePlacesCompleted.value) return t('course.detail.bulkVisitUndoCompleted');
  return allRoutePlacesTracked.value ? t('course.detail.bulkVisitCompleted') : t('course.detail.bulkVisitPlanned');
});

watch(route, (value) => {
  selectedDay.value = value?.days?.[0]?.dayNumber ?? 1;
  if (value) void ensureAutoSaved();
}, { immediate: true });

function readAutoSaveRecords() {
  if (typeof sessionStorage === 'undefined') return {};
  try {
    return JSON.parse(sessionStorage.getItem(AUTO_SAVE_RECORDS_KEY) || '{}') || {};
  } catch {
    return {};
  }
}

function writeAutoSaveRecord(generationId, record) {
  if (!generationId || typeof sessionStorage === 'undefined') return;
  const records = readAutoSaveRecords();
  records[generationId] = {
    ...record,
    updatedAt: Date.now(),
  };
  sessionStorage.setItem(AUTO_SAVE_RECORDS_KEY, JSON.stringify(records));
}

function autoSaveRecord(generationId) {
  return generationId ? readAutoSaveRecords()[generationId] : null;
}

function routePlaceSignature(targetRoute) {
  return (targetRoute?.days ?? [])
    .flatMap((day) => (day.places ?? []).map((place, index) => [day.dayNumber, place.visitOrder ?? index + 1, place.placeId].join(':')))
    .join('|');
}

function routeAutoSaveSignature(targetRoute) {
  if (!targetRoute) return '';
  return [
    targetRoute.title,
    targetRoute.summary,
    Array.isArray(targetRoute.contentIds) ? targetRoute.contentIds.join(',') : targetRoute.contentId,
    Array.isArray(targetRoute.regions) ? targetRoute.regions.join(',') : targetRoute.region,
    targetRoute.durationDays,
    targetRoute.startDate,
    targetRoute.endDate,
    routePlaceSignature(targetRoute),
  ].map((value) => String(value ?? '').trim()).join('::');
}

function matchingSavedCourse(targetRoute) {
  const signature = routeAutoSaveSignature(targetRoute);
  if (!signature) return null;
  return uiStore.savedCourses.find((course) => routeAutoSaveSignature(course) === signature) ?? null;
}

function clearSavedNotice() {
  saveError.value = '';
  saveNotice.value = null;
}

async function restoreSavedRoute(savedRouteId) {
  if (!savedRouteId) return false;
  const loaded = await uiStore.loadCourseDetail(savedRouteId);
  if (!loaded) return false;
  uiStore.generatedRoute = loaded;
  uiStore.persist();
  clearSavedNotice();
  return true;
}

async function ensureAutoSaved({ force = false } = {}) {
  const currentRoute = route.value;
  if (!currentRoute || savingRoute.value) return;

  if (!isGeneratedUnsavedRoute.value) {
    if (isResultSaved.value) clearSavedNotice();
    return;
  }

  const generationId = generationRouteId.value;
  if (!generationId) return;
  const record = autoSaveRecord(generationId);
  if (!force && record?.savedRouteId && await restoreSavedRoute(record.savedRouteId)) return;
  if (!force && autoSaveGenerationKey.value === generationId) return;

  autoSaveGenerationKey.value = generationId;
  showActionMenu.value = false;
  saveError.value = '';
  saveNotice.value = {
    tone: 'info',
    title: t('aiCourse.result.savingCourse'),
    text: t('aiCourse.result.savingCourseText'),
  };
  savingRoute.value = true;
  writeAutoSaveRecord(generationId, { status: 'saving', routeSignature: routeAutoSaveSignature(currentRoute) });

  try {
    await uiStore.loadSavedCourses();
    const existing = matchingSavedCourse(currentRoute);
    if (existing) {
      uiStore.generatedRoute = existing;
      uiStore.persist();
      writeAutoSaveRecord(generationId, { status: 'saved', savedRouteId: existing.routeId, routeSignature: routeAutoSaveSignature(currentRoute) });
      clearSavedNotice();
      return;
    }

    const saved = await uiStore.saveCourse(currentRoute);
    if (!saved) {
      throw new Error(uiStore.routeError || t('aiCourse.result.saveFailedText'));
    }
    writeAutoSaveRecord(generationId, { status: 'saved', savedRouteId: saved.routeId, routeSignature: routeAutoSaveSignature(currentRoute) });
    clearSavedNotice();
  } catch (error) {
    saveError.value = error?.message || uiStore.routeError || t('aiCourse.result.saveFailedText');
    saveNotice.value = {
      tone: 'error',
      title: t('aiCourse.result.saveFailed'),
      text: saveError.value,
    };
    writeAutoSaveRecord(generationId, { status: 'failed', routeSignature: routeAutoSaveSignature(currentRoute), message: saveError.value });
  } finally {
    savingRoute.value = false;
    autoSaveGenerationKey.value = '';
  }
}

function handleResultAction() {
  if (saveError.value) {
    void ensureAutoSaved({ force: true });
    return;
  }
  if (!isResultSaved.value || !route.value?.routeId) return;
  router.push({ name: 'my-course-manage', params: { routeId: route.value.routeId } });
}

function openShareSheet() {
  if (!uiStore.requireAuth(t('autoPass.ui_7bdc2a95cb'))) return;
  if (resultShareDisabled.value) {
    uiStore.notify(t('course.detail.shareUnavailable'));
    return;
  }
  showActionMenu.value = false;
  if (typeof window !== 'undefined' && window.matchMedia?.('(hover: hover) and (pointer: fine)').matches) {
    void shareMessage();
    return;
  }
  showShareSheet.value = true;
}

function editCourse() {
  if (!route.value) return;
  showActionMenu.value = false;
  router.push('/ai/edit');
}

function post() {
  if (!route.value || !uiStore.requireAuth(t('autoPass.ui_0c7460357b'))) return;
  sessionStorage.setItem('scenik-community-draft', JSON.stringify({
    board: 'region',
    title: route.value.title,
    body: route.value.summary,
    region: selectedRegion.value,
    duration: `${route.value.durationDays}\uc77c`,
    routeId: isResultSaved.value ? route.value.routeId : '',
    tags: [selectedRegion.value, route.value.style].filter(Boolean),
  }));
  router.push({ name: 'community-write', query: { from: 'ai', routeId: isResultSaved.value ? route.value.routeId : undefined } });
}

function stopPlace(stop) {
  return routeCandidateMap.value.get(stop.placeId) ?? stop;
}

function stopTags(stop) {
  return [stopCategory(stop)];
}

function stopCategory(stop) {
  const place = stopPlace(stop);
  return place?.category || stop.category || t('autoPass.ui_b9938dc081');
}

function stopAddress(stop) {
  const place = stopPlace(stop);
  return [stop.address, place?.address, stop.roadAddress, place?.roadAddress]
    .map((value) => String(value ?? '').trim())
    .find(Boolean) ?? '';
}

function stopTransitInfo(stop) {
  const place = stopPlace(stop);
  const station = [
    stop.nearestStationName,
    place?.nearestStationName,
    stop.nearestStation,
    place?.nearestStation,
    stop.stationName,
    place?.stationName,
    stop.transitStation,
    place?.transitStation,
  ].map((value) => String(value ?? '').trim()).find(Boolean) ?? '';
  const numberFrom = (...values) => values.map(Number).find((value) => Number.isFinite(value) && value > 0) ?? null;
  const minutes = numberFrom(stop.nearestStationWalkingMinutes, place?.nearestStationWalkingMinutes, stop.walkingMinutes, place?.walkingMinutes, stop.transitMinutes, place?.transitMinutes);
  const meters = numberFrom(stop.nearestStationDistanceMeters, place?.nearestStationDistanceMeters, stop.stationDistanceMeters, place?.stationDistanceMeters, stop.transitDistanceMeters, place?.transitDistanceMeters);
  if (!((minutes != null && minutes <= 30) || (meters != null && meters <= 2000))) return '';
  if (station && minutes != null) return `${station}\uc5d0\uc11c \ub3c4\ubcf4 ${Math.round(minutes)}\ubd84`;
  if (station && meters != null) return t('autoPass.ui_8abb142c89', { value0: station, value1: (meters / 1000).toFixed(meters >= 1000 ? 1 : 0) });
  if (station) return station;
  if (minutes != null) return `\uac00\uae4c\uc6b4 \ub300\uc911\uad50\ud1b5\uae4c\uc9c0 \ub3c4\ubcf4 ${Math.round(minutes)}\ubd84`;
  if (meters != null) return t('autoPass.ui_3cb40f0fcf', { value0: (meters / 1000).toFixed(meters >= 1000 ? 1 : 0) });
  return '';
}

function normalizeRegion(value) {
  const normalized = String(value ?? '').replace(/\s+/g, '');
  if (normalized.startsWith('\uc11c\uc6b8')) return '\uc11c\uc6b8';
  if (normalized.startsWith('\ubd80\uc0b0')) return '\ubd80\uc0b0';
  if (normalized.startsWith('\uc778\ucc9c')) return '\uc778\ucc9c';
  if (normalized.startsWith('\ub300\uad6c')) return '\ub300\uad6c';
  if (normalized.startsWith('\ub300\uc804')) return '\ub300\uc804';
  if (normalized.startsWith('\uad11\uc8fc')) return '\uad11\uc8fc';
  if (normalized.startsWith('\uc6b8\uc0b0')) return '\uc6b8\uc0b0';
  if (normalized.startsWith('\uc138\uc885')) return '\uc138\uc885';
  if (normalized.startsWith('\uacbd\uae30')) return '\uacbd\uae30';
  if (normalized.startsWith('\uac15\uc6d0')) return '\uac15\uc6d0';
  if (normalized.startsWith('\ucda9\ubd81') || normalized.startsWith('\ucda9\uccad\ubd81\ub3c4')) return '\ucda9\ubd81';
  if (normalized.startsWith('\ucda9\ub0a8') || normalized.startsWith('\ucda9\uccad\ub0a8\ub3c4')) return '\ucda9\ub0a8';
  if (normalized.startsWith('\uc804\ubd81') || normalized.startsWith('\uc804\ub77c\ubd81\ub3c4')) return '\uc804\ubd81';
  if (normalized.startsWith('\uc804\ub0a8') || normalized.startsWith('\uc804\ub77c\ub0a8\ub3c4')) return '\uc804\ub0a8';
  if (normalized.startsWith('\uacbd\ubd81') || normalized.startsWith('\uacbd\uc0c1\ubd81\ub3c4')) return '\uacbd\ubd81';
  if (normalized.startsWith('\uacbd\ub0a8') || normalized.startsWith('\uacbd\uc0c1\ub0a8\ub3c4')) return '\uacbd\ub0a8';
  if (normalized.startsWith('\uc81c\uc8fc')) return '\uc81c\uc8fc';
  return normalized;
}

function isSelectedRegionPlace(place) {
  if (!selectedRegions.value.length) return true;
  return selectedRegions.value.some((region) => (
    normalizeRegion(place?.region) === normalizeRegion(region)
    || normalizeRegion(place?.address) === normalizeRegion(region)
  ));
}

function closeShareSheet() {
  showShareSheet.value = false;
}

async function copyShareLink() {
  if (!resultShareUrl.value) {
    uiStore.notify(t('course.detail.shareUnavailable'));
    closeShareSheet();
    return;
  }
  const copied = await copyCourseUrl(resultShareUrl.value);
  uiStore.notify(copied ? t('course.detail.linkCopied') : t('course.detail.copyLinkFailed'), copied ? 'success' : 'info');
  closeShareSheet();
}

async function shareMessage() {
  if (!resultShareUrl.value) {
    uiStore.notify(t('course.detail.shareUnavailable'));
    closeShareSheet();
    return;
  }
  const result = await shareCourseUrl({
    title: route.value?.title,
    text: route.value?.summary,
    url: resultShareUrl.value,
  });
  if (result.ok) {
    uiStore.notify(t('course.detail.shareSuccess'), 'success');
  } else if (result.reason !== 'aborted') {
    uiStore.notify(t('course.detail.shareUnavailable'));
  }
  closeShareSheet();
}

async function markRoutePlacesVisitStatus() {
  if (!route.value || !uiStore.requireAuth(t('autoPass.ui_5823398baa'))) return;
  const placeIds = routePlaceIds.value;
  if (!placeIds.length) return;
  const targetStatus = allRoutePlacesCompleted.value ? 'planned' : allRoutePlacesTracked.value ? 'completed' : 'planned';
  showActionMenu.value = false;
  closeShareSheet();
  for (const placeId of placeIds) {
    await uiStore.setVisit(placeId, targetStatus);
  }
  uiStore.notify(t('course.detail.bulkVisitSuccessText', { count: placeIds.length }), 'success');
}

function postFromShareSheet() {
  closeShareSheet();
  post();
}

async function focusResultPlaceOnMap(stop) {
  const placeId = String(stop?.placeId ?? stop?.id ?? '');
  if (!placeId) return;
  selectedMapPlaceId.value = '';
  await nextTick();
  selectedMapPlaceId.value = placeId;
  resultMapSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
</script>

<template>
  <main class="app-shell ai-result-shell">
    <section v-if="route" class="ai-result-card">
      <header class="ai-result-topbar">
        <h1>{{ t('aiCourse.result.title') }}</h1>
        <button
          type="button"
          class="result-menu-button"
          :aria-label="t('autoPass.ui_9f8509e966')"
          aria-controls="ai-result-action-menu"
          :aria-expanded="showActionMenu"
          @click="showActionMenu = !showActionMenu"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" /></svg>
        </button>
        <AnimatePresence>
          <motion.div v-if="showActionMenu" class="result-menu-backdrop" v-bind="motionVariants.backdrop()" @click="showActionMenu = false">
          <motion.div id="ai-result-action-menu" class="result-menu-popover" role="menu" v-bind="motionVariants.popover()" @click.stop>
            <button type="button" role="menuitem" :disabled="resultShareDisabled" @click="openShareSheet">
              <span class="result-menu-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 10.8 6.8-4.1M8.6 13.2l6.8 4.1" /></svg>
              </span>
              {{ t('autoPass.ui_2598405791') }}
            </button>
            <button type="button" role="menuitem" :disabled="bulkVisitActionDisabled" @click="markRoutePlacesVisitStatus">
              <span class="result-menu-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M12 21s7-5.4 7-11.2A7 7 0 0 0 5 9.8C5 15.6 12 21 12 21Z" /><circle cx="12" cy="9.8" r="2.3" /></svg>
              </span>
              {{ bulkVisitActionLabel }}
            </button>
            <button type="button" role="menuitem" @click="editCourse">
              <span class="result-menu-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" /><path d="m14 7 3 3" /></svg>
              </span>
              {{ t('autoPass.ui_a5c3fe7c05') }}
            </button>
          </motion.div>
          </motion.div>
        </AnimatePresence>
      </header>

      <div class="ai-result-scroll">
        <h2>{{ route.title }}</h2>
        <p class="ai-result-meta">{{ resultMeta }}</p>

        <CourseSaveStatusPanel
          :title="t('aiCourse.result.courseSummary')"
          eyebrow=""
          :description="t('aiCourse.result.description')"
          :rows="saveStatusRows"
          :notice="saveNotice"
        />

        <div ref="resultMapSection">
          <KakaoRouteMap :stops="stops" :regions="selectedRegions" :selected-place-id="selectedMapPlaceId" />
        </div>

        <div v-if="dayTabs.length > 1" class="day-tabs result-day-tabs">
          <button v-for="day in dayTabs" :key="day" type="button" :class="{ active: day === selectedDay }" @click="selectedDay = day">
            Day {{ day }}
          </button>
        </div>

        <div class="prototype-timeline">
          <article
            v-for="(stop, index) in stops"
            :key="`${stop.placeId}-${index}`"
            class="prototype-timeline-item prototype-timeline-item--selectable"
            role="button"
            tabindex="0"
            @click="focusResultPlaceOnMap(stop)"
            @keydown.enter.prevent="focusResultPlaceOnMap(stop)"
            @keydown.space.prevent="focusResultPlaceOnMap(stop)"
          >
            <span class="prototype-timeline-dot"></span>
            <div>
              <strong>{{ stop.placeName }}</strong>
              <p v-if="stopAddress(stop)">{{ stopAddress(stop) }}</p>
              <p v-if="stopTransitInfo(stop)" class="timeline-note">{{ stopTransitInfo(stop) }}</p>
              <div class="prototype-stop-tags">
                <span v-for="tag in stopTags(stop)" :key="tag">{{ tag }}</span>
              </div>
            </div>
          </article>
        </div>
      </div>

      <footer class="ai-result-footer">
        <BaseButton class="ai-result-done-button" block :disabled="resultActionDisabled" @click="handleResultAction">
          {{ resultActionLabel }}
        </BaseButton>
      </footer>

      <AnimatePresence>
        <motion.div v-if="showShareSheet" class="sheet-backdrop ai-result-share-backdrop" v-bind="motionVariants.backdrop()" @click.self="closeShareSheet">
        <motion.div class="bottom-sheet ai-result-share-sheet" role="dialog" aria-modal="true" :aria-label="t('autoPass.ui_98ca11280f')" v-bind="motionVariants.bottomSheet()">
          <div class="sheet-handle"></div>
          <h2>{{ route.title }}</h2>
          <p>{{ shareSummary }}</p>
          <div class="ai-share-options">
            <button type="button" @click="shareMessage"><b class="kakao">💬</b><span>{{ t('autoPass.ui_eb43aa3bc4') }}</span></button>
            <button type="button" @click="shareMessage"><b class="instagram">📷</b><span>{{ t('autoPass.ui_bb40affdb7') }}</span></button>
            <button type="button" @click="shareMessage"><b class="message">💬</b><span>{{ t('autoPass.ui_1cff363a9f') }}</span></button>
            <button type="button" @click="copyShareLink"><b class="link">🔗</b><span>{{ t('autoPass.ui_8272efc57a') }}</span></button>
          </div>
          <div class="ai-share-actions">
            <button type="button" :disabled="bulkVisitActionDisabled" @click="markRoutePlacesVisitStatus">{{ bulkVisitActionLabel }}</button>
            <button type="button" @click="postFromShareSheet">{{ t('autoPass.ui_74103ad724') }}</button>
          </div>
          <button type="button" class="ai-share-close" @click="closeShareSheet">{{ t('autoPass.ui_41e472961f') }}</button>
        </motion.div>
        </motion.div>
      </AnimatePresence>
    </section>

    <section v-else class="result-empty">
      <EmptyState
        icon="AI"
        tone="route"
        :title="t('autoPass.ui_7aafa37c7b')"
        :text="t('autoPass.ui_5a6476e876')"
        :action-label="t('autoPass.ui_26c24120b7')"
        action-to="/ai"
      />
    </section>
  </main>
</template>
