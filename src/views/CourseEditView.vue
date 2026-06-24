<script setup>
import { useI18n } from 'vue-i18n';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import BaseButton from '../components/common/BaseButton.vue';
import EmptyState from '../components/common/EmptyState.vue';
import { getUserMessage } from '../api/error.js';
import { fetchPlaces } from '../api/placeApi.js';
import { contentPlaces, places as catalogPlaces } from '../data/mockData.js';
import { useUiStore } from '../stores/uiStore.js';

const { t } = useI18n();

const VISIT_WORTHY_KEYWORDS = ['\ucd2c\uc601', '\uad00\uad11', '\uad81\uad90', '\uc804\ud1b5', '\ub9c8\uc744', '\uac70\ub9ac', '\uce74\ud398', '\uacf5\uc6d0', '\ubb38\ud654', '\uc2dc\uc7a5', '\uc804\ub9dd', '\ud574\ubcc0', '\ubbf8\uc220\uad00', '\ubc15\ubb3c\uad00'];
const REST_KEYWORDS = ['\ub9db\uc9d1', '\uacf5\uc5f0', '\uc11c\uc810', '\uac24\ub7ec\ub9ac'];
const WEAK_STOP_KEYWORDS = ['\ud559\uad50', '\ud638\ud154', '\ubaa8\ud154', '\ub9ac\uc870\ud2b8', '\uc0c1\uc810', '\ub9e4\uc7a5', '\ud68c\uc0ac', '\ubcd1\uc6d0'];

const route = useRoute();
const router = useRouter();
const uiStore = useUiStore();
const draftDays = ref([]);
const saveError = ref('');
const editToast = ref(null);
const draftTitle = ref('');
const candidateTargetDay = ref(1);
const placeSearchKeyword = ref('');
const placeSearchRegion = ref('');
const searchedPlaces = ref([]);
const placeSearchLoading = ref(false);
const placeSearchError = ref('');
const draggingStop = ref(null);
const dragOverStop = ref(null);
const pointerDrag = ref({ active: false });
const draggingDay = ref(null);
const dragOverDay = ref(null);
const dayPointerDrag = ref({ active: false });
let editToastTimer;

const routeId = computed(() => route.params.routeId ?? '');
const isAiEdit = computed(() => route.name === 'ai-edit');
const detail = computed(() => isAiEdit.value ? null : uiStore.resolveCourseDetail(routeId.value));
const course = computed(() => isAiEdit.value ? uiStore.generatedRoute : detail.value?.route ?? null);
const isSavedCourse = computed(() => !isAiEdit.value && detail.value?.source === 'saved');
const usedPlaceIds = computed(() => new Set(draftDays.value.flatMap((day) => day.places.map((stop) => stop.placeId))));
const candidateById = computed(() => new Map((course.value?.candidatePlaces ?? [])
  .filter((place) => place?.placeId)
  .map((place) => [place.placeId, place])));
const selectedContentIdSet = computed(() => {
  const ids = new Set([course.value?.contentId, ...(course.value?.contentIds ?? [])].filter(Boolean));
  (course.value?.candidatePlaces ?? []).forEach((candidate) => {
    candidateContentIds(candidate).forEach((contentId) => ids.add(contentId));
  });
  draftDays.value.flatMap((day) => day.places).forEach((stop) => {
    candidateContentIds(stop).forEach((contentId) => ids.add(contentId));
    contentPlaces
      .filter((item) => item.placeId === stop.placeId)
      .forEach((item) => ids.add(item.contentId));
    const catalogPlace = catalogPlaces.find((place) => place.placeId === stop.placeId);
    (catalogPlace?.relatedContentIds ?? []).forEach((contentId) => ids.add(contentId));
  });
  return ids;
});
const courseRegionSet = computed(() => {
  const regions = new Set();
  if (Array.isArray(course.value?.regions)) {
    course.value.regions.filter(Boolean).forEach((region) => regions.add(region));
  }
  String(course.value?.region ?? '')
    .split(/[,.·]/)
    .map((region) => region.trim())
    .filter(Boolean)
    .forEach((region) => regions.add(region));
  draftDays.value.flatMap((day) => day.places)
    .map((stop) => stop.region ?? candidateById.value.get(stop.placeId)?.region)
    .filter(Boolean)
    .forEach((region) => regions.add(region));
  return regions;
});
const routeCenter = computed(() => {
  const coordinates = draftDays.value
    .flatMap((day) => day.places)
    .map((stop) => candidateById.value.get(stop.placeId) ?? stop)
    .map((place) => ({ latitude: Number(place.latitude), longitude: Number(place.longitude) }))
    .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude));
  if (!coordinates.length) return null;
  return {
    latitude: coordinates.reduce((sum, point) => sum + point.latitude, 0) / coordinates.length,
    longitude: coordinates.reduce((sum, point) => sum + point.longitude, 0) / coordinates.length,
  };
});
const recommendationPool = computed(() => {
  const candidates = new Map();

  function addCandidate(candidate) {
    const placeId = candidate?.placeId;
    const name = candidate?.name ?? candidate?.placeName;
    if (!placeId || !name || usedPlaceIds.value.has(placeId)) return;
    candidates.set(placeId, { ...candidates.get(placeId), ...candidate, name, placeName: candidate.placeName ?? name });
  }

  (course.value?.candidatePlaces ?? []).forEach(addCandidate);

  const selectedContentIds = selectedContentIdSet.value;
  contentPlaces
    .filter((item) => selectedContentIds.has(item.contentId))
    .forEach((item) => {
      const place = catalogPlaces.find((catalogPlace) => catalogPlace.placeId === item.placeId);
      addCandidate(normalizeCatalogCandidate(place, item.contentId));
    });

  catalogPlaces
    .filter((place) => (place.relatedContentIds ?? []).some((contentId) => selectedContentIds.has(contentId)))
    .forEach((place) => addCandidate(normalizeCatalogCandidate(place)));

  if (candidates.size < 8) {
    catalogPlaces
      .filter((place) => isCourseRegionCandidate(place) && visitCategoryScore(place) > 0)
      .forEach((place) => addCandidate(normalizeCatalogCandidate(place)));
  }

  return [...candidates.values()];
});
const recommendedCandidates = computed(() => sortCandidatePlaces(recommendationPool.value).slice(0, 12));
const verifiedSearchCandidates = computed(() => sortCandidatePlaces(searchedPlaces.value
  .filter((place) => place?.placeId && !usedPlaceIds.value.has(place.placeId))));
const currentPlaceCount = computed(() => draftDays.value.reduce((sum, day) => sum + day.places.length, 0));
const originalPlaceCount = computed(() => (course.value?.days ?? []).reduce((sum, day) => sum + (day.places?.length ?? 0), 0));
const changedPlaceCount = computed(() => Math.abs(currentPlaceCount.value - originalPlaceCount.value));

function cloneDays(value) {
  const candidates = new Map((value?.candidatePlaces ?? []).map((place) => [place.placeId, place]));
  return (value?.days ?? []).map((day, dayIndex) => ({
    ...day,
    dayNumber: dayIndex + 1,
    places: (day.places ?? []).map((stop, stopIndex) => {
      const candidate = candidates.get(stop.placeId) ?? {};
      return {
        ...candidate,
        ...stop,
        placeName: stop.placeName ?? stop.name ?? candidate.placeName ?? candidate.name,
        category: stop.category ?? stop.placeCategory ?? stop.type ?? candidate.category ?? '\uc7a5\uc18c',
        address: stop.address ?? candidate.address,
        latitude: stop.latitude ?? candidate.latitude,
        longitude: stop.longitude ?? candidate.longitude,
        dayNumber: dayIndex + 1,
        visitOrder: stopIndex + 1,
      };
    }),
  }));
}

watch(course, (value) => {
  draftTitle.value = value?.title ?? '';
  draftDays.value = cloneDays(value);
  saveError.value = '';
  editToast.value = null;
  candidateTargetDay.value = draftDays.value[0]?.dayNumber ?? 1;
  placeSearchRegion.value = value?.region ?? '';
  draggingStop.value = null;
  dragOverStop.value = null;
  draggingDay.value = null;
  dragOverDay.value = null;
}, { immediate: true });
watch(editToast, (value) => {
  window.clearTimeout(editToastTimer);
  if (!value) return;
  editToastTimer = window.setTimeout(() => {
    editToast.value = null;
  }, value.tone === 'warning' || value.tone === 'error' ? 3200 : 1800);
});

onMounted(async () => {
  if (!isAiEdit.value && routeId.value) {
    await uiStore.loadCourseDetail(routeId.value);
  }
});

function renumberDays(days) {
  return days.map((day, dayIndex) => ({
    ...day,
    dayNumber: dayIndex + 1,
    places: day.places.map((stop, stopIndex) => ({
      ...stop,
      dayNumber: dayIndex + 1,
      visitOrder: stopIndex + 1,
    })),
  }));
}

function placeName(placeId) {
  return candidateById.value.get(placeId)?.name
    ?? candidateById.value.get(placeId)?.placeName
    ?? t('autoPass.ui_46de3a5a60');
}

function stopKey(dayIndex, stopIndex) {
  return `${dayIndex}-${stopIndex}`;
}

function cloneDraftDays() {
  return draftDays.value.map((day) => ({
    ...day,
    places: [...day.places],
  }));
}

function normalizeCatalogCandidate(place, relatedContentId = '') {
  if (!place) return null;
  const contentId = relatedContentId || place.relatedContentIds?.find((id) => selectedContentIdSet.value.has(id)) || place.relatedContentIds?.[0] || '';
  return {
    placeId: place.placeId,
    name: place.placeName ?? place.name,
    placeName: place.placeName ?? place.name,
    region: place.region,
    category: place.category,
    address: place.address,
    latitude: place.latitude,
    longitude: place.longitude,
    relatedContentId: contentId,
    relatedContentIds: place.relatedContentIds ?? (contentId ? [contentId] : []),
    relatedContentTitle: course.value?.contentTitle ?? course.value?.title ?? '\uc120\ud0dd \ucf58\ud150\uce20',
    sceneDescription: place.description,
    verified: place.verified !== false,
    imageUrl: place.imageUrl,
  };
}

function isCourseRegionCandidate(candidate = {}) {
  if (!courseRegionSet.value.size) return true;
  return courseRegionSet.value.has(candidate.region);
}
function normalizeSearchPlace(place) {
  return {
    placeId: place.placeId,
    name: place.name ?? place.placeName,
    placeName: place.placeName ?? place.name,
    region: place.region,
    category: place.category,
    address: place.address,
    latitude: place.latitude,
    longitude: place.longitude,
    relatedContentId: course.value?.contentId ?? course.value?.contentIds?.[0] ?? 'db-place-search',
    relatedContentTitle: course.value?.contentTitle ?? course.value?.title ?? '\uc800\uc7a5 \ucf54\uc2a4',
    sceneDescription: place.description ?? '\uac80\uc99d\ub41c \uc7a5\uc18c\uc785\ub2c8\ub2e4.',
    verified: place.verified !== false,
    imageUrl: place.imageUrl,
  };
}

function candidateContentIds(candidate = {}) {
  return [
    candidate.relatedContentId,
    ...(candidate.relatedContentIds ?? []),
    ...(candidate.relatedContents ?? []).map((content) => content.contentId ?? content.relatedContentId),
  ].filter(Boolean);
}

function isSelectedContentCandidate(candidate) {
  const selectedIds = selectedContentIdSet.value;
  if (!selectedIds.size) return false;
  return candidateContentIds(candidate).some((contentId) => selectedIds.has(contentId));
}

function includesAny(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
}

function visitCategoryScore(candidate = {}) {
  const text = `${candidate.category ?? ''} ${candidate.name ?? candidate.placeName ?? ''}`.toLowerCase();
  if (includesAny(text, VISIT_WORTHY_KEYWORDS)) return 4;
  if (includesAny(text, REST_KEYWORDS)) return 2;
  if (includesAny(text, WEAK_STOP_KEYWORDS)) return -4;
  return 0;
}

function distanceScore(candidate = {}) {
  if (!routeCenter.value) return 0;
  const latitude = Number(candidate.latitude);
  const longitude = Number(candidate.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return 0;
  const distance = Math.abs(latitude - routeCenter.value.latitude) + Math.abs(longitude - routeCenter.value.longitude);
  return Math.max(0, 3 - distance * 35);
}

function candidatePriority(candidate) {
  return (isSelectedContentCandidate(candidate) ? 10 : 0)
    + (isCourseRegionCandidate(candidate) ? 4 : 0)
    + visitCategoryScore(candidate)
    + distanceScore(candidate);
}

function sortCandidatePlaces(list = []) {
  return [...list].sort((left, right) => candidatePriority(right) - candidatePriority(left)
    || String(left.region ?? '').localeCompare(String(right.region ?? ''), 'ko')
    || String(left.name ?? left.placeName ?? '').localeCompare(String(right.name ?? right.placeName ?? ''), 'ko'));
}

function candidateReason(candidate = {}) {
  if (isSelectedContentCandidate(candidate)) {
    return t('autoPass.ui_c236ae5460', { value0: candidate.relatedContentTitle ?? t('autoPass.ui_11b6b0909a') });
  }
  return t('autoPass.ui_c613d01caf', { value0: candidate.region ?? t('autoPass.ui_476d4b9ddd'), value1: candidate.category ?? t('autoPass.ui_6efb3787d7') });
}

async function searchVerifiedPlaces() {
  placeSearchLoading.value = true;
  placeSearchError.value = '';
  try {
    const result = await fetchPlaces({
      keyword: placeSearchKeyword.value.trim() || undefined,
      region: placeSearchRegion.value || undefined,
    });
    searchedPlaces.value = (Array.isArray(result) ? result : [])
      .filter((place) => place.verified !== false)
      .map(normalizeSearchPlace);
  } catch (error) {
    const query = placeSearchKeyword.value.trim().toLowerCase();
    searchedPlaces.value = [];
    placeSearchError.value = getUserMessage(error, query
      ? t('autoPass.ui_d9176c2e57')
      : t('autoPass.ui_f8f5a64bec'));
  } finally {
    placeSearchLoading.value = false;
  }
}

function isDayDragTarget(dayIndex) {
  return draggingDay.value !== null && dragOverDay.value === dayIndex;
}

function finishDayDrag() {
  draggingDay.value = null;
  dragOverDay.value = null;
}

function cleanupDayPointerDrag() {
  window.removeEventListener('pointermove', moveDayPointerDrag);
  window.removeEventListener('pointerup', endDayPointerDrag);
  window.removeEventListener('pointercancel', cancelDayPointerDrag);
  dayPointerDrag.value = { active: false };
}

function shouldSkipDayDrag(event) {
  const target = event.target;
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('button, a, input, textarea, select, label, [role="button"], .editable-stop-card'));
}

function startDayPointerDrag(dayIndex, event) {
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  if (shouldSkipDayDrag(event)) return;
  event.preventDefault();
  cancelPointerDrag();
  dayPointerDrag.value = {
    active: true,
    dayIndex,
    startX: event.clientX,
    startY: event.clientY,
    moved: false,
  };
  draggingDay.value = dayIndex;
  dragOverDay.value = dayIndex;
  window.addEventListener('pointermove', moveDayPointerDrag);
  window.addEventListener('pointerup', endDayPointerDrag);
  window.addEventListener('pointercancel', cancelDayPointerDrag);
}

function moveDayPointerDrag(event) {
  if (!dayPointerDrag.value.active) return;
  const distanceX = Math.abs(event.clientX - dayPointerDrag.value.startX);
  const distanceY = Math.abs(event.clientY - dayPointerDrag.value.startY);
  if (!dayPointerDrag.value.moved && distanceX + distanceY < 6) return;
  dayPointerDrag.value = { ...dayPointerDrag.value, moved: true };
  const target = document.elementFromPoint(event.clientX, event.clientY);
  const dayElement = target?.closest?.('[data-day-index]');
  if (!dayElement) return;
  const rect = dayElement.getBoundingClientRect();
  const dayIndex = Number(dayElement.dataset.dayIndex);
  dragOverDay.value = dayIndex + (event.clientY > rect.top + rect.height / 2 ? 1 : 0);
}

function endDayPointerDrag() {
  if (dayPointerDrag.value.active && dayPointerDrag.value.moved && dragOverDay.value !== null) {
    moveDraggedDay(dragOverDay.value);
  } else {
    finishDayDrag();
  }
  cleanupDayPointerDrag();
}
function cancelDayPointerDrag() {
  finishDayDrag();
  cleanupDayPointerDrag();
}

function moveDraggedDay(targetDayIndex) {
  const sourceDayIndex = draggingDay.value;
  if (sourceDayIndex === null || sourceDayIndex === undefined) return;

  const days = cloneDraftDays();
  const [day] = days.splice(sourceDayIndex, 1);
  if (!day) {
    finishDayDrag();
    return;
  }

  let insertIndex = targetDayIndex;
  if (sourceDayIndex < targetDayIndex) insertIndex -= 1;
  insertIndex = Math.max(0, Math.min(insertIndex, days.length));
  if (insertIndex === sourceDayIndex) {
    finishDayDrag();
    return;
  }
  days.splice(insertIndex, 0, day);
  draftDays.value = renumberDays(days);
  candidateTargetDay.value = Math.min(candidateTargetDay.value, draftDays.value.length) || 1;
  editToast.value = {
    tone: 'success',
    title: t('autoPass.ui_319c625989'),
    text: t('autoPass.ui_ebe2950a2a'),
  };
  finishDayDrag();
}
function isDragTarget(dayIndex, stopIndex) {
  return dragOverStop.value?.dayIndex === dayIndex && dragOverStop.value?.stopIndex === stopIndex;
}

function finishDrag() {
  draggingStop.value = null;
  dragOverStop.value = null;
  draggingDay.value = null;
  dragOverDay.value = null;
}

function cleanupPointerDrag() {
  window.removeEventListener('pointermove', movePointerDrag);
  window.removeEventListener('pointerup', endPointerDrag);
  window.removeEventListener('pointercancel', cancelPointerDrag);
  pointerDrag.value = { active: false };
}

function startPointerDrag(dayIndex, stopIndex, event) {
  if (dayPointerDrag.value.active) return;
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  event.preventDefault();
  pointerDrag.value = { active: true, dayIndex, stopIndex };
  draggingStop.value = { dayIndex, stopIndex };
  dragOverStop.value = { dayIndex, stopIndex };
  window.addEventListener('pointermove', movePointerDrag);
  window.addEventListener('pointerup', endPointerDrag);
  window.addEventListener('pointercancel', cancelPointerDrag);
}

function movePointerDrag(event) {
  if (dayPointerDrag.value.active) return;
  if (!pointerDrag.value.active) return;
  const target = document.elementFromPoint(event.clientX, event.clientY);
  const stopElement = target?.closest?.('[data-stop-day]');

  if (stopElement) {
    const rect = stopElement.getBoundingClientRect();
    const stopIndex = Number(stopElement.dataset.stopIndex);
    dragOverStop.value = {
      dayIndex: Number(stopElement.dataset.stopDay),
      stopIndex: stopIndex + (event.clientY > rect.top + rect.height / 2 ? 1 : 0),
    };
    return;
  }

  const dayElement = target?.closest?.('[data-day-index]');
  if (dayElement) {
    const dayIndex = Number(dayElement.dataset.dayIndex);
    dragOverStop.value = {
      dayIndex,
      stopIndex: draftDays.value[dayIndex]?.places.length ?? 0,
    };
  }
}

function endPointerDrag() {
  const target = dragOverStop.value;
  if (pointerDrag.value.active && target) {
    moveDraggedStop(target.dayIndex, target.stopIndex);
  } else {
    finishDrag();
  }
  cleanupPointerDrag();
}

function cancelPointerDrag() {
  finishDrag();
  cleanupPointerDrag();
}

function moveDraggedStop(targetDayIndex, targetStopIndex) {
  const source = draggingStop.value;
  if (!source) return;

  const days = cloneDraftDays();
  const sourceDay = days[source.dayIndex];
  const targetDay = days[targetDayIndex];
  if (!sourceDay || !targetDay) return;

  if (sourceDay.places.length <= 1 && source.dayIndex !== targetDayIndex) {
    uiStore.notify(t('autoPass.ui_589f804359'));
    finishDrag();
    return;
  }

  const [item] = sourceDay.places.splice(source.stopIndex, 1);
  let insertIndex = targetStopIndex;
  if (source.dayIndex === targetDayIndex && source.stopIndex < targetStopIndex) {
    insertIndex -= 1;
  }
  targetDay.places.splice(Math.max(0, insertIndex), 0, item);
  draftDays.value = renumberDays(days);
  editToast.value = {
    tone: 'success',
    title: t('autoPass.ui_d30810f617'),
    text: '',
  };
  finishDrag();
}

function addCandidateToDay(dayIndex, candidate) {
  if (!candidate || !draftDays.value[dayIndex]) return;
  if (usedPlaceIds.value.has(candidate.placeId)) {
    saveError.value = t('autoPass.ui_51d13ab7ee', { value0: candidate.name ?? candidate.placeName });
    editToast.value = {
      tone: 'warning',
      title: t('autoPass.ui_778303e2d4'),
      text: saveError.value,
    };
    uiStore.notify(saveError.value);
    return;
  }
  const days = cloneDraftDays();
  days[dayIndex].places.push({
    placeId: candidate.placeId,
    placeName: candidate.name ?? candidate.placeName,
    category: candidate.category ?? '\uc7a5\uc18c',
    address: candidate.address,
    latitude: candidate.latitude,
    longitude: candidate.longitude,
    dayNumber: dayIndex + 1,
    visitOrder: days[dayIndex].places.length + 1,
    recommendedTime: '17:00',
    reason: candidateReason(candidate),
    travelTip: '',
  });
  draftDays.value = renumberDays(days);
  editToast.value = {
    tone: 'success',
    title: t('autoPass.ui_a40b1983a5'),
    text: t('autoPass.ui_6efc7d43e6', { value0: candidate.name ?? candidate.placeName, value1: dayIndex + 1 }),
  };
}

function candidateDayIndex() {
  const index = draftDays.value.findIndex((day) => day.dayNumber === candidateTargetDay.value);
  return index >= 0 ? index : 0;
}

function addCandidateToSelectedDay(candidate) {
  addCandidateToDay(candidateDayIndex(), candidate);
}

function removeStop(dayIndex, stopIndex) {
  const day = draftDays.value[dayIndex];
  if (!day) return;
  if (day.places.length <= 1) {
    editToast.value = {
      tone: 'warning',
      title: t('autoPass.ui_a46109112e'),
      text: t('autoPass.ui_589f804359'),
    };
    uiStore.notify(t('autoPass.ui_589f804359'));
    return;
  }
  const days = cloneDraftDays();
  days[dayIndex].places.splice(stopIndex, 1);
  draftDays.value = renumberDays(days);
  editToast.value = {
    tone: 'success',
    title: t('autoPass.ui_28f659a76b'),
    text: '',
  };
}

function buildEditedRoute() {
  const candidateMap = new Map((course.value?.candidatePlaces ?? []).map((place) => [place.placeId, place]));
  const days = renumberDays(draftDays.value);
  const usedIds = new Set(days.flatMap((day) => day.places.map((place) => place.placeId)));
  searchedPlaces.value
    .filter((place) => usedIds.has(place.placeId))
    .forEach((place) => candidateMap.set(place.placeId, place));
  return {
    ...course.value,
    title: draftTitle.value.trim() || course.value.title,
    candidatePlaces: [...candidateMap.values()],
    days,
  };
}

async function saveEdit() {
  if (!course.value) return;
  saveError.value = '';
  if (!draftTitle.value.trim()) {
    saveError.value = t('autoPass.ui_f8d75bf3ea');
    editToast.value = {
      tone: 'warning',
      title: t('autoPass.ui_4817c4caf4'),
      text: saveError.value,
    };
    return;
  }
  if (!currentPlaceCount.value) {
    saveError.value = t('autoPass.ui_559f07aa49');
    editToast.value = {
      tone: 'warning',
      title: t('autoPass.ui_59b9e0e419'),
      text: saveError.value,
    };
    return;
  }
  editToast.value = {
    tone: 'info',
    title: t('autoPass.ui_2aea48a05b'),
    text: t('autoPass.ui_15335d29ca'),
  };
  const editedRoute = buildEditedRoute();

  if (isAiEdit.value) {
    const updated = uiStore.updateGeneratedRoute(editedRoute);
    if (!updated) {
      saveError.value = uiStore.toast || t('autoPass.ui_d3728ac3ae');
      editToast.value = {
        tone: 'error',
        title: t('autoPass.ui_3126a73522'),
        text: saveError.value,
      };
      return;
    }
    editToast.value = {
      tone: 'success',
      title: t('autoPass.ui_b51f3b3121'),
      text: t('autoPass.ui_46b501361e'),
    };
    window.setTimeout(() => router.push('/ai/result'), 450);
    return;
  }

  const updated = await uiStore.updateSavedCourse(editedRoute);
  if (!updated) {
    saveError.value = uiStore.toast || t('autoPass.ui_52e0bcc598');
    editToast.value = {
      tone: 'error',
      title: t('autoPass.ui_0ebd2445e8'),
      text: saveError.value,
    };
    return;
  }
  editToast.value = {
    tone: 'success',
    title: t('autoPass.ui_b51f3b3121'),
    text: t('autoPass.ui_99a63996fa'),
  };
  window.setTimeout(() => router.push({ name: 'my-course-manage', params: { routeId: editedRoute.routeId } }), 450);
}

function cancelEdit() {
  if (isAiEdit.value) {
    router.push('/ai/result');
    return;
  }
  router.push({ name: 'my-course-manage', params: { routeId: routeId.value } });
}

onBeforeUnmount(() => {
  window.clearTimeout(editToastTimer);
  cleanupPointerDrag();
  cleanupDayPointerDrag();
});
</script>

<template>
  <AppLayout :title="t('autoPass.ui_cfd9b718b1')" back>
    <section v-if="!uiStore.currentUser && !isAiEdit" class="course-edit-screen">
      <EmptyState
        icon="K"
        tone="login"
        :title="t('autoPass.ui_d81760e635')"
        :text="t('autoPass.ui_a4c3989ca8')"
        :action-label="t('autoPass.ui_f7b621a901')"
        action-to="/login"
      />
    </section>

    <section v-else-if="!course" class="course-edit-screen">
      <EmptyState
        icon="AI"
        tone="route"
        :title="t('autoPass.ui_2a8ed33f41')"
        :text="t('autoPass.ui_b9f7c9f3e1')"
        :action-label="isAiEdit ? t('autoPass.ui_26c24120b7') : t('autoPass.ui_d79a64cd04')"
        :action-to="isAiEdit ? '/ai' : '/my/activity/saved-routes'"
      />
    </section>

    <section v-else-if="!isSavedCourse && !isAiEdit" class="course-edit-screen">
      <EmptyState
        icon="AI"
        tone="route"
        :title="t('autoPass.ui_f98ba8e4f5')"
        :text="t('autoPass.ui_8ea85068e8')"
      />
      <BaseButton block @click="uiStore.saveCourse(course)">{{ t('autoPass.ui_23a85365d8') }}</BaseButton>
    </section>

    <section v-else class="course-edit-screen">
      <div class="page-intro compact-intro">
        <span class="badge ai">{{ isAiEdit ? t('autoPass.ui_2347e74e06') : t('autoPass.ui_ebf0f22f10') }}</span>
        <h1>{{ course.title }}</h1>
        <p>{{ t('autoPass.ui_b54d6a6174') }}</p>
      </div>

      <section class="course-edit-entity-form" aria-labelledby="course-edit-form-title">
        <div class="section-mini-header">
          <h2 id="course-edit-form-title">{{ t('autoPass.ui_ad89e26754') }}</h2>
          <span>{{ isAiEdit ? t('autoPass.ui_f1b45f05e1') : t('autoPass.ui_d91f63e6be') }}</span>
        </div>
        <label class="form-field">
          {{ t('autoPass.ui_e13bbd67a4') }}
          <input v-model="draftTitle" maxlength="48" :placeholder="t('autoPass.ui_e13bbd67a4')" />
        </label>
      </section>
      <div class="all-day-edit-list">
        <section
          v-for="(day, dayIndex) in draftDays"
          :key="day.dayNumber"
          class="course-day-section"
          :class="{ 'is-day-dragging': draggingDay === dayIndex, 'is-day-drag-over': isDayDragTarget(dayIndex) }"
          :data-day-index="dayIndex"
          @pointerdown="startDayPointerDrag(dayIndex, $event)"
        >
          <div class="course-day-header">
            <div class="course-day-title">
              <span>Day {{ day.dayNumber }}</span>
              <small>{{ t('autoPass.ui_de7f33f31f', { count: day.places.length }) }}</small>
            </div>
          </div>

          <div class="day-stop-list">
            <article
              v-for="(stop, stopIndex) in day.places"
              :key="`${stop.placeId}-${stop.visitOrder}`"
              class="editable-stop-card"
              :class="{ 'is-drag-over': isDragTarget(dayIndex, stopIndex), 'is-dragging': draggingStop?.dayIndex === dayIndex && draggingStop?.stopIndex === stopIndex }"
              :data-stop-day="dayIndex"
              :data-stop-index="stopIndex"
              @pointerdown="startPointerDrag(dayIndex, stopIndex, $event)"
            >
              <div class="editable-stop-main">
                <div class="editable-stop-copy">
                  <strong>{{ stop.placeName || placeName(stop.placeId) }}</strong>
                  <small>{{ stop.category || stop.reason }}</small>
                </div>

                <button type="button" class="remove-stop-button" :aria-label="t('autoPass.ui_683a5ca835')" @click.stop="removeStop(dayIndex, stopIndex)" @pointerdown.stop draggable="false">×</button>
              </div>
            </article>
          </div>
        </section>
      </div>

      <section class="candidate-panel course-recommend-panel">
        <div class="section-mini-header">
          <h2>{{ t('autoPass.ui_cb3ee035c5') }}</h2>
          <span>{{ t('autoPass.ui_de7f33f31f', { count: recommendedCandidates.length }) }}</span>
        </div>
        <p>{{ t('autoPass.ui_e96cfd2639') }}</p>
        <div v-if="draftDays.length" class="candidate-day-tabs" :aria-label="t('autoPass.ui_b5d403ffb8')">
          <button
            v-for="day in draftDays"
            :key="day.dayNumber"
            type="button"
            :class="{ active: day.dayNumber === candidateTargetDay }"
            @click="candidateTargetDay = day.dayNumber"
          >
            Day {{ day.dayNumber }}
          </button>
        </div>
        <form class="auth-form" @submit.prevent="searchVerifiedPlaces">
          <label class="form-field">
            {{ t('autoPass.ui_1aac866a94') }}
            <input v-model="placeSearchKeyword" :placeholder="t('autoPass.ui_d25be4db0b')" />
          </label>
          <label class="form-field">
            {{ t('autoPass.ui_1745c23c9e') }}
            <input v-model="placeSearchRegion" :placeholder="t('autoPass.ui_01bacf204e')" />
          </label>
          <BaseButton block type="submit" :disabled="placeSearchLoading">
            {{ placeSearchLoading ? t('autoPass.ui_9421e1e7ff') : t('autoPass.ui_9c44225b7c') }}
          </BaseButton>
          <p v-if="placeSearchError" class="form-help">{{ placeSearchError }}</p>
        </form>
        <div v-if="verifiedSearchCandidates.length" class="candidate-chip-grid recommended-place-grid">
          <button
            v-for="candidate in verifiedSearchCandidates"
            :key="`search-${candidate.placeId}`"
            type="button"
            @click="addCandidateToSelectedDay(candidate)"
          >
            <strong>{{ candidate.name }}</strong>
            <small>{{ candidate.region }} · {{ candidate.category }}</small>
            <span>{{ t('autoPass.ui_dfb43dcf27') }}</span>
          </button>
        </div>
        <div v-if="recommendedCandidates.length" class="candidate-chip-grid recommended-place-grid">
          <button
            v-for="candidate in recommendedCandidates"
            :key="candidate.placeId"
            type="button"
            @click="addCandidateToSelectedDay(candidate)"
          >
            <strong>{{ candidate.name }}</strong>
            <small>{{ candidate.region }} · {{ candidate.category }}</small>
            <span>{{ t('autoPass.ui_dfb43dcf27') }}</span>
          </button>
        </div>
        <EmptyState
          v-else-if="!verifiedSearchCandidates.length"
          icon="P"
          tone="search"
          compact
          :title="t('autoPass.ui_c1dc163a19')"
          :text="t('autoPass.ui_bf6141bc87')"
        />
      </section>

      <div
        v-if="editToast"
        class="course-edit-toast"
        :class="'course-edit-toast--' + editToast.tone"
        role="status"
        aria-live="polite"
      >
        <strong>{{ editToast.title }}</strong>
        <span v-if="editToast.text">{{ editToast.text }}</span>
      </div>
      <p v-if="saveError" class="form-error">{{ saveError }}</p>

      <div class="sticky-actions">
        <BaseButton block :disabled="uiStore.routeActionLoading" @click="saveEdit">
          {{ uiStore.routeActionLoading ? t('autoPass.ui_2aea48a05b') : t('autoPass.ui_699133f6ff') }}
        </BaseButton>
        <BaseButton variant="ghost" block :disabled="uiStore.routeActionLoading" @click="cancelEdit">{{ t('autoPass.ui_0b8441a434') }}</BaseButton>
      </div>
    </section>
  </AppLayout>
</template>
