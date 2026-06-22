<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import BaseButton from '../components/common/BaseButton.vue';
import EmptyState from '../components/common/EmptyState.vue';
import { getUserMessage } from '../api/error.js';
import { fetchPlaces } from '../api/placeApi.js';
import { contentPlaces, places as catalogPlaces } from '../data/mockData.js';
import { useUiStore } from '../stores/uiStore.js';

const VISIT_WORTHY_KEYWORDS = ['촬영', '관광', '궁궐', '전통', '마을', '거리', '카페', '공원', '문화', '시장', '전망', '해변', '미술관', '박물관'];
const REST_KEYWORDS = ['맛집', '공연', '서점', '갤러리'];
const WEAK_STOP_KEYWORDS = ['학교', '호텔', '모텔', '리조트', '상점', '매장', '회사', '병원'];

const route = useRoute();
const router = useRouter();
const uiStore = useUiStore();
const draftDays = ref([]);
const saveError = ref('');
const editToast = ref(null);
const draftTitle = ref('');
const activeTimePicker = ref('');
const candidateTargetDay = ref(1);
const placeSearchKeyword = ref('');
const placeSearchRegion = ref('');
const searchedPlaces = ref([]);
const placeSearchLoading = ref(false);
const placeSearchError = ref('');
const draggingStop = ref(null);
const dragOverStop = ref(null);
const pointerDrag = ref({ active: false });
let editToastTimer;

const timeOptions = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
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
        category: stop.category ?? stop.placeCategory ?? stop.type ?? candidate.category ?? '장소',
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
  activeTimePicker.value = '';
  candidateTargetDay.value = draftDays.value[0]?.dayNumber ?? 1;
  placeSearchRegion.value = value?.region ?? '';
  draggingStop.value = null;
  dragOverStop.value = null;
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
    ?? '검증 장소';
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
    relatedContentTitle: course.value?.contentTitle ?? course.value?.title ?? '선택 콘텐츠',
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
    relatedContentTitle: course.value?.contentTitle ?? course.value?.title ?? '저장 코스',
    sceneDescription: place.description ?? '검증된 장소입니다.',
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
    return `${candidate.relatedContentTitle ?? '선택 콘텐츠'} 분위기와 연결된 장소입니다.`;
  }
  return `${candidate.region ?? '같은 지역'}에서 함께 들르기 좋은 ${candidate.category ?? '장소'}입니다.`;
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
      ? '장소 검색에 연결하지 못했습니다. 검색어를 바꿔 다시 시도해 주세요.'
      : '장소 검색에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  } finally {
    placeSearchLoading.value = false;
  }
}

function isDragTarget(dayIndex, stopIndex) {
  return dragOverStop.value?.dayIndex === dayIndex && dragOverStop.value?.stopIndex === stopIndex;
}

function finishDrag() {
  draggingStop.value = null;
  dragOverStop.value = null;
}

function cleanupPointerDrag() {
  window.removeEventListener('pointermove', movePointerDrag);
  window.removeEventListener('pointerup', endPointerDrag);
  window.removeEventListener('pointercancel', cancelPointerDrag);
  pointerDrag.value = { active: false };
}

function startPointerDrag(dayIndex, stopIndex, event) {
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
    uiStore.notify('각 Day에는 최소 1개 장소가 필요합니다.');
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
    title: '순서를 변경했습니다.',
    text: '',
  };
  finishDrag();
}

function addCandidateToDay(dayIndex, candidate) {
  if (!candidate || !draftDays.value[dayIndex]) return;
  if (usedPlaceIds.value.has(candidate.placeId)) {
    saveError.value = `${candidate.name ?? candidate.placeName}는 이미 코스에 포함되어 있습니다.`;
    editToast.value = {
      tone: 'warning',
      title: '이미 추가된 장소입니다.',
      text: saveError.value,
    };
    uiStore.notify(saveError.value);
    return;
  }
  const days = cloneDraftDays();
  days[dayIndex].places.push({
    placeId: candidate.placeId,
    placeName: candidate.name ?? candidate.placeName,
    category: candidate.category ?? '장소',
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
    title: '장소를 추가했습니다.',
    text: `${candidate.name ?? candidate.placeName}을 Day ${dayIndex + 1}에 추가했습니다.`,
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
      title: '삭제할 수 없습니다.',
      text: '각 Day에는 최소 1개 장소가 필요합니다.',
    };
    uiStore.notify('각 Day에는 최소 1개 장소가 필요합니다.');
    return;
  }
  const days = cloneDraftDays();
  days[dayIndex].places.splice(stopIndex, 1);
  draftDays.value = renumberDays(days);
  editToast.value = {
    tone: 'success',
    title: '장소를 제거했습니다.',
    text: '',
  };
}

function setStopTime(stop, value) {
  stop.recommendedTime = value;
  activeTimePicker.value = '';
  editToast.value = null;
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
    saveError.value = '코스 제목을 입력해 주세요.';
    editToast.value = {
      tone: 'warning',
      title: '입력 내용을 확인해 주세요.',
      text: saveError.value,
    };
    return;
  }
  if (!currentPlaceCount.value) {
    saveError.value = '장소를 1개 이상 포함해 주세요.';
    editToast.value = {
      tone: 'warning',
      title: '코스 구성을 확인해 주세요.',
      text: saveError.value,
    };
    return;
  }
  editToast.value = {
    tone: 'info',
    title: '저장 중입니다.',
    text: '변경한 코스를 저장하고 있습니다.',
  };
  const editedRoute = buildEditedRoute();

  if (isAiEdit.value) {
    const updated = uiStore.updateGeneratedRoute(editedRoute);
    if (!updated) {
      saveError.value = uiStore.toast || 'AI 코스를 저장하지 못했습니다.';
      editToast.value = {
        tone: 'error',
        title: '저장하지 못했습니다.',
        text: saveError.value,
      };
      return;
    }
    editToast.value = {
      tone: 'success',
      title: '수정되었습니다.',
      text: 'AI 코스 편집 결과가 반영되었습니다.',
    };
    window.setTimeout(() => router.push('/ai/result'), 450);
    return;
  }

  const updated = await uiStore.updateSavedCourse(editedRoute);
  if (!updated) {
    saveError.value = uiStore.toast || '저장 코스를 수정하지 못했습니다.';
    editToast.value = {
      tone: 'error',
      title: '수정하지 못했습니다.',
      text: saveError.value,
    };
    return;
  }
  editToast.value = {
    tone: 'success',
    title: '수정되었습니다.',
    text: '저장한 코스가 업데이트되었습니다.',
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
});
</script>

<template>
  <AppLayout title="코스 편집" back>
    <section v-if="!uiStore.currentUser && !isAiEdit" class="course-edit-screen">
      <EmptyState
        icon="K"
        tone="login"
        title="로그인이 필요합니다"
        text="저장한 코스 편집은 로그인 후 사용할 수 있습니다."
        action-label="로그인하기"
        action-to="/login"
      />
    </section>

    <section v-else-if="!course" class="course-edit-screen">
      <EmptyState
        icon="AI"
        tone="route"
        title="편집할 코스를 찾을 수 없습니다"
        text="AI 코스를 생성하거나 저장 코스 목록에서 다시 선택해 주세요."
        :action-label="isAiEdit ? 'AI Course 만들기' : '저장 코스 보기'"
        :action-to="isAiEdit ? '/ai' : '/my/activity/saved-routes'"
      />
    </section>

    <section v-else-if="!isSavedCourse && !isAiEdit" class="course-edit-screen">
      <EmptyState
        icon="AI"
        tone="route"
        title="먼저 저장이 필요합니다"
        text="인기 코스나 추천 코스는 저장한 뒤 편집할 수 있습니다."
      />
      <BaseButton block @click="uiStore.saveCourse(course)">코스 저장</BaseButton>
    </section>

    <section v-else class="course-edit-screen">
      <div class="page-intro compact-intro">
        <span class="badge ai">{{ isAiEdit ? 'AI 결과 편집' : '저장 코스 편집' }}</span>
        <h1>{{ course.title }}</h1>
        <p>날짜별 장소를 정리하고 방문 시간을 조정해 코스를 다듬어 보세요.</p>
      </div>

      <section class="course-edit-entity-form" aria-labelledby="course-edit-form-title">
        <div class="section-mini-header">
          <h2 id="course-edit-form-title">코스 수정</h2>
          <span>{{ isAiEdit ? '생성 결과' : '저장 코스' }}</span>
        </div>
        <label class="form-field">
          코스 제목
          <input v-model="draftTitle" maxlength="48" placeholder="코스 제목" />
        </label>
      </section>
<div class="all-day-edit-list">
        <section
          v-for="(day, dayIndex) in draftDays"
          :key="day.dayNumber"
          class="course-day-section"
          :data-day-index="dayIndex"
        >
          <div class="course-day-header">
            <span>Day {{ day.dayNumber }}</span>
            <small>{{ day.places.length }}곳</small>
          </div>

          <div class="day-stop-list">
            <article
              v-for="(stop, stopIndex) in day.places"
              :key="`${stop.placeId}-${stop.visitOrder}`"
              class="editable-stop-card"
              :class="{ 'is-drag-over': isDragTarget(dayIndex, stopIndex), 'is-dragging': draggingStop?.dayIndex === dayIndex && draggingStop?.stopIndex === stopIndex }"
              :data-stop-day="dayIndex"
              :data-stop-index="stopIndex"
            >
              <div class="editable-stop-main">
                <button
                  type="button"
                  class="drag-grip"
                  aria-label="순서 변경"
                  @pointerdown="startPointerDrag(dayIndex, stopIndex, $event)"
                >
                  ⋮⋮
                </button>

                <div class="time-picker-wrap">
                  <button type="button" class="time-pill" @click="activeTimePicker = activeTimePicker === stopKey(dayIndex, stopIndex) ? '' : stopKey(dayIndex, stopIndex)">
                    {{ stop.recommendedTime }}
                  </button>
                  <div v-if="activeTimePicker === stopKey(dayIndex, stopIndex)" class="time-menu">
                    <button v-for="time in timeOptions" :key="time" type="button" @click="setStopTime(stop, time)">
                      {{ time }}
                    </button>
                  </div>
                </div>

                <div class="editable-stop-copy">
                  <strong>{{ stop.placeName || placeName(stop.placeId) }}</strong>
                  <small>{{ stop.category || stop.reason }}</small>
                </div>

                <button type="button" class="remove-stop-button" aria-label="장소 제거" @click="removeStop(dayIndex, stopIndex)">×</button>
              </div>
            </article>
          </div>
        </section>
      </div>

      <section class="candidate-panel course-recommend-panel">
        <div class="section-mini-header">
          <h2>추천 장소</h2>
          <span>{{ recommendedCandidates.length }}곳</span>
        </div>
        <p>선택한 콘텐츠와 연결된 장소를 먼저 보여주고, 이미 포함된 장소는 제외합니다.</p>
        <div v-if="draftDays.length" class="candidate-day-tabs" aria-label="추천 장소를 추가할 Day 선택">
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
            검증 장소 검색
            <input v-model="placeSearchKeyword" placeholder="장소명 또는 키워드" />
          </label>
          <label class="form-field">
            지역
            <input v-model="placeSearchRegion" placeholder="서울, 부산..." />
          </label>
          <BaseButton block type="submit" :disabled="placeSearchLoading">
            {{ placeSearchLoading ? '검색 중...' : '장소 검색' }}
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
            <span>추가</span>
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
            <span>추가</span>
          </button>
        </div>
        <EmptyState
          v-else-if="!verifiedSearchCandidates.length"
          icon="P"
          tone="search"
          compact
          title="추가할 추천 장소가 없습니다"
          text="현재 코스에 연결된 후보 장소가 모두 포함되어 있습니다. 검색으로 다른 검증 장소를 찾아보세요."
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
          {{ uiStore.routeActionLoading ? '저장 중입니다.' : '변경사항 저장' }}
        </BaseButton>
        <BaseButton variant="ghost" block :disabled="uiStore.routeActionLoading" @click="cancelEdit">취소</BaseButton>
      </div>
    </section>
  </AppLayout>
</template>