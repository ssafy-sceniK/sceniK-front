<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import EmptyState from '../components/common/EmptyState.vue';
import FormStatusNotice from '../components/common/FormStatusNotice.vue';
import CourseDeleteActionSheet from '../components/course/CourseDeleteActionSheet.vue';
import DetailNotFoundPanel from '../components/detail/DetailNotFoundPanel.vue';
import MapPreview from '../components/course/MapPreview.vue';
import Timeline from '../components/course/Timeline.vue';
import { useUiStore } from '../stores/uiStore.js';

const route = useRoute();
const router = useRouter();
const uiStore = useUiStore();
const selectedDay = ref(1);
const showDeleteSheet = ref(false);
const loadingDetail = ref(false);
const actionNotice = ref(null);
const showActionMenu = ref(false);

const routeId = computed(() => route.params.routeId ?? '');
const isMyCourseRoute = computed(() => route.path.startsWith('/my/course-manage'));
const detail = computed(() => uiStore.resolveCourseDetail(routeId.value));
const course = computed(() => detail.value?.route ?? null);
const isSavedCourse = computed(() => isMyCourseRoute.value && detail.value?.source === 'saved');
const canManageCourse = computed(() => isSavedCourse.value);
const shouldRequireLogin = computed(() => isMyCourseRoute.value && !uiStore.currentUser);
const validationErrors = computed(() => detail.value?.validation?.errors ?? []);
const routeCandidateMap = computed(() => new Map((course.value?.candidatePlaces ?? [])
  .filter((place) => place?.placeId)
  .map((place) => [place.placeId, place])));
const routeDays = computed(() => (course.value?.days ?? []).map((day) => ({
  ...day,
  places: (day.places ?? []).map(enrichStop),
})));
const dayTabs = computed(() => routeDays.value.map((day) => day.dayNumber));
const stops = computed(() => routeDays.value.find((day) => day.dayNumber === selectedDay.value)?.places ?? []);
const routePlaces = computed(() => routeDays.value.flatMap((day) => day.places ?? []));
const selectedDayRoutePlaces = computed(() => stops.value);
const displayRegionLabel = computed(() => firstText(course.value?.region, routePlaces.value.find((place) => place.region)?.region, '선택 지역'));
const displayDurationLabel = computed(() => `${Number(course.value?.durationDays ?? dayTabs.value.length ?? 1) || 1}일`);
const displayTransportLabel = computed(() => firstText(course.value?.transport, '이동 조건'));
const travelStyleChips = computed(() => {
  const styles = Array.isArray(course.value?.travelStyles) && course.value.travelStyles.length
    ? course.value.travelStyles
    : splitDisplayList(course.value?.style);
  return [...new Set(styles.map((style) => String(style).trim()).filter(Boolean))];
});
const primaryStyleLabel = computed(() => travelStyleChips.value[0] ?? '감성 여행');
const courseDetailChips = computed(() => [
  displayRegionLabel.value,
  displayDurationLabel.value,
  displayTransportLabel.value,
  `${routePlaces.value.length}곳`,
  ...travelStyleChips.value,
].filter(Boolean));
const courseSummaryText = computed(() => {
  const summary = String(course.value?.summary ?? '').trim();
  if (summary && summary.length <= 72 && !isInternalCourseCopy(summary)) return summary;
  return '';
});
const courseTrustMessage = computed(() => {
  if (isSavedCourse.value) return '';
  const message = String(course.value?.trustMessage ?? '').trim();
  if (isInternalCourseCopy(message)) return '';
  return message;
});
const deleteLoading = computed(() => uiStore.routeActionLoading && showDeleteSheet.value);

function firstText(...values) {
  return values.find((value) => value !== undefined && value !== null && String(value).trim() !== '') ?? '';
}

function splitDisplayList(value) {
  return String(value ?? '')
    .split(/[,.·]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function enrichStop(stop = {}) {
  const candidate = routeCandidateMap.value.get(stop.placeId) ?? {};
  const placeName = firstText(stop.placeName, stop.name, candidate.placeName, candidate.name, '장소');
  return {
    ...candidate,
    ...stop,
    name: firstText(stop.name, stop.placeName, candidate.name, candidate.placeName, placeName),
    placeName,
    category: firstText(stop.category, stop.placeCategory, stop.type, candidate.category, '장소'),
    address: firstText(stop.address, candidate.address),
    region: firstText(stop.region, candidate.region),
    district: firstText(stop.district, candidate.district),
    latitude: firstText(stop.latitude, candidate.latitude),
    longitude: firstText(stop.longitude, candidate.longitude),
    imageUrl: firstText(stop.imageUrl, stop.thumbnailUrl, candidate.imageUrl, candidate.thumbnailUrl),
  };
}

function isInternalCourseCopy(value) {
  if (!value) return false;
  return /C_[A-Z]+_\d+/.test(value)
    || /contentId|routeId|Course CRUD|AI Course template/i.test(value)
    || /sceniK DB|DB|verified places connected|This course uses only verified/i.test(value)
    || /검증\s*장소만|검증된\s*장소만|내부|정책/.test(value);
}

async function loadDetail() {
  if (!isMyCourseRoute.value) return;
  loadingDetail.value = true;
  await uiStore.loadCourseDetail(routeId.value);
  loadingDetail.value = false;
}

onMounted(loadDetail);

watch(course, (value) => {
  selectedDay.value = value?.days?.[0]?.dayNumber ?? 1;
}, { immediate: true });

function editCourse() {
  if (!course.value) return;

  if (isSavedCourse.value) {
    router.push({ name: 'my-course-edit-with-id', params: { routeId: course.value.routeId } });
    return;
  }

  if (uiStore.openCourse(course.value)) {
    router.push('/ai/edit');
  }
}

async function saveTemplateCourse() {
  if (!course.value) return;
  actionNotice.value = {
    tone: 'info',
    title: '코스를 저장하고 있습니다.',
    text: '선택한 코스를 저장 목록에 추가하고 있습니다.',
  };
  const saved = await uiStore.saveCourse(course.value);
  actionNotice.value = saved
    ? {
        tone: 'success',
        title: '저장되었습니다.',
        text: '마이페이지에서 다시 확인할 수 있습니다.',
      }
    : {
        tone: 'error',
        title: '저장하지 못했습니다.',
        text: uiStore.routeError || '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      };
}

function viewAsAiResult() {
  if (!course.value) return;
  if (uiStore.openCourse(course.value)) router.push('/ai/result');
}

function closeActionMenu() {
  showActionMenu.value = false;
}

function runCourseAction(action) {
  closeActionMenu();
  action();
}

function openDeleteSheet() {
  closeActionMenu();
  showDeleteSheet.value = true;
}

function shareUrl() {
  if (typeof window === 'undefined') return '';
  return window.location.href;
}

async function shareCourse() {
  if (!uiStore.requireAuth('로그인하면 코스를 공유할 수 있습니다.')) return;
  if (!course.value) return;

  const payload = {
    title: course.value.title,
    text: courseSummaryText.value,
    url: shareUrl(),
  };

  try {
    if (navigator.share) {
      await navigator.share(payload);
    } else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(`${payload.title}\n${payload.text}\n${payload.url}`.trim());
    }
    actionNotice.value = null;
    uiStore.notify('공유되었습니다.', 'success');
  } catch (error) {
    if (error?.name === 'AbortError') return;
    uiStore.notify('공유를 완료하지 못했습니다.');
  }
}

async function deleteCourse() {
  if (!isSavedCourse.value || !course.value?.routeId) return;
  actionNotice.value = {
    tone: 'info',
    title: '코스를 삭제하고 있습니다.',
    text: '저장한 코스 목록에서 제거하고 있습니다.',
  };
  const deleted = await uiStore.deleteSavedCourse(course.value.routeId);
  if (!deleted) {
    actionNotice.value = {
      tone: 'error',
      title: '삭제하지 못했습니다.',
      text: uiStore.routeError || '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    };
    return;
  }
  actionNotice.value = {
    tone: 'success',
    title: '삭제되었습니다.',
    text: '저장한 코스 목록에서 제거했습니다.',
  };
  showDeleteSheet.value = false;
  window.setTimeout(() => router.replace('/my/activity/saved-routes'), 450);
}
</script>

<template>
  <AppLayout title="코스 상세" back>
    <template #actions>
      <div v-if="course" class="course-detail-menu">
        <button
          type="button"
          class="icon-button course-detail-menu__trigger"
          aria-label="코스 메뉴"
          aria-haspopup="menu"
          :aria-expanded="showActionMenu"
          @click="showActionMenu = !showActionMenu"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="5" cy="12" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="19" cy="12" r="1.8" />
          </svg>
        </button>
        <div v-if="showActionMenu" class="course-detail-menu__overlay" @click="closeActionMenu"></div>
        <div v-if="showActionMenu" class="course-detail-menu__popover" role="menu">
          <button v-if="canManageCourse" type="button" role="menuitem" @click="runCourseAction(editCourse)">수정</button>
          <button type="button" role="menuitem" @click="runCourseAction(shareCourse)">공유</button>
          <button v-if="!isSavedCourse" type="button" role="menuitem" :disabled="uiStore.routeActionLoading" @click="runCourseAction(saveTemplateCourse)">
            {{ uiStore.routeActionLoading ? '저장 중' : '저장' }}
          </button>
          <button v-if="canManageCourse" type="button" role="menuitem" @click="runCourseAction(viewAsAiResult)">AI 결과로 보기</button>
          <button v-if="canManageCourse" type="button" role="menuitem" class="danger" :disabled="uiStore.routeActionLoading" @click="openDeleteSheet">
            삭제
          </button>
        </div>
      </div>
    </template>

    <section v-if="shouldRequireLogin" class="course-detail-screen">
      <EmptyState
        icon="K"
        tone="login"
        title="로그인이 필요합니다"
        text="저장한 코스는 로그인 후 확인할 수 있습니다."
        action-label="로그인하기"
        action-to="/login"
      />
    </section>

    <section v-else-if="loadingDetail" class="course-detail-screen">
      <EmptyState
        tone="loading"
        compact
        title="코스를 불러오는 중입니다"
        text="저장한 일정과 장소 순서를 확인하고 있어요."
      />
    </section>

    <section v-else-if="course" class="course-detail-screen">
      <div class="course-manage-header result-hero">
        <span class="badge ai course-detail-badge">{{ isSavedCourse ? '저장 코스' : '추천 코스' }}</span>
        <h1>{{ course.title }}</h1>
        <p v-if="courseSummaryText" class="course-detail-summary">{{ courseSummaryText }}</p>
        <div v-if="course.dateRangeLabel" class="result-date">{{ course.dateRangeLabel }}</div>
        <div class="course-detail-chip-list" aria-label="코스 정보">
          <span v-for="chip in courseDetailChips" :key="chip" class="course-detail-chip">{{ chip }}</span>
        </div>
      </div>

      <div v-if="validationErrors.length" class="trust-panel course-warning">
        {{ validationErrors[0] }}
      </div>
      <div v-else-if="courseTrustMessage" class="trust-panel">
        {{ courseTrustMessage }}
      </div>

      <FormStatusNotice
        v-if="actionNotice"
        :tone="actionNotice.tone"
        :title="actionNotice.title"
        :text="actionNotice.text"
      />

      <MapPreview :route-places="selectedDayRoutePlaces" :total-places="stops.length" />

      <div v-if="dayTabs.length > 1" class="day-tabs">
        <button v-for="day in dayTabs" :key="day" type="button" :class="{ active: day === selectedDay }" @click="selectedDay = day">
          Day {{ day }}
        </button>
      </div>

      <Timeline :stops="stops" />

      <CourseDeleteActionSheet
        v-if="showDeleteSheet"
        :loading="deleteLoading"
        @cancel="showDeleteSheet = false"
        @confirm="deleteCourse"
      />
    </section>

    <section v-else class="course-detail-screen">
      <DetailNotFoundPanel
        title="코스를 찾을 수 없습니다"
        :text="uiStore.routeError || '저장 목록에서 삭제되었거나 아직 저장한 코스가 없습니다. 저장한 코스를 다시 선택하거나 AI 코스를 만들어 보세요.'"
        list-label="저장한 코스 보기"
        list-to="/my/activity/saved-routes"
        @retry="loadDetail"
      />
    </section>
  </AppLayout>
</template>