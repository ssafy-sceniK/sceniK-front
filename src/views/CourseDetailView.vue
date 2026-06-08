<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import BaseButton from '../components/common/BaseButton.vue';
import EmptyState from '../components/common/EmptyState.vue';
import MapPreview from '../components/course/MapPreview.vue';
import Timeline from '../components/course/Timeline.vue';
import { useUiStore } from '../stores/uiStore.js';

const route = useRoute();
const router = useRouter();
const uiStore = useUiStore();
const selectedDay = ref(1);
const showDeleteSheet = ref(false);
const loadingDetail = ref(false);

const routeId = computed(() => route.params.routeId ?? '');
const isMyCourseRoute = computed(() => route.path.startsWith('/my/course-manage'));
const detail = computed(() => uiStore.resolveCourseDetail(routeId.value));
const course = computed(() => detail.value?.route ?? null);
const isSavedCourse = computed(() => isMyCourseRoute.value && detail.value?.source === 'saved');
const shouldRequireLogin = computed(() => isMyCourseRoute.value && !uiStore.currentUser);
const validationErrors = computed(() => detail.value?.validation?.errors ?? []);
const dayTabs = computed(() => course.value?.days?.map((day) => day.dayNumber) ?? []);
const stops = computed(() => course.value?.days?.find((day) => day.dayNumber === selectedDay.value)?.places ?? []);
const routeCandidateMap = computed(() => new Map((course.value?.candidatePlaces ?? [])
  .map((place) => [place.placeId, place])));
const routePlaces = computed(() => (course.value?.days ?? []).flatMap((day) => day.places ?? []).map((stop) => ({
  ...routeCandidateMap.value.get(stop.placeId),
  ...stop,
  placeName: stop.placeName ?? stop.name ?? routeCandidateMap.value.get(stop.placeId)?.placeName ?? routeCandidateMap.value.get(stop.placeId)?.name,
})) ?? []);

onMounted(async () => {
  if (!isMyCourseRoute.value) return;
  loadingDetail.value = true;
  await uiStore.loadCourseDetail(routeId.value);
  loadingDetail.value = false;
});

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
  await uiStore.saveCourse(course.value);
}

function viewAsAiResult() {
  if (!course.value) return;
  if (uiStore.openCourse(course.value)) router.push('/ai/result');
}

function shareCourse() {
  if (!uiStore.requireAuth('로그인하면 코스를 공유할 수 있습니다.')) return;
  const text = course.value ? `${course.value.title}\n${course.value.summary}` : 'sceniK course';
  navigator.clipboard?.writeText?.(text)
    .then(() => uiStore.notify('공유 문구를 복사했습니다.'))
    .catch(() => uiStore.notify('공유 문구가 준비되었습니다.'));
}

async function deleteCourse() {
  if (!isSavedCourse.value || !course.value?.routeId) return;
  const deleted = await uiStore.deleteSavedCourse(course.value.routeId);
  if (!deleted) return;
  showDeleteSheet.value = false;
  router.replace('/my/activity/saved-routes');
}

</script>

<template>
  <AppLayout title="코스 상세" back>
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
        <span class="badge ai">{{ isSavedCourse ? 'Saved Course' : 'Popular Course' }}</span>
        <h1>{{ course.title }}</h1>
        <p>{{ course.summary }}</p>
        <div v-if="course.dateRangeLabel" class="result-date">{{ course.dateRangeLabel }}</div>
        <div class="result-stats">
          <span>{{ course.region }}</span>
          <span>{{ course.durationDays }}일</span>
          <span>{{ course.transport }}</span>
        </div>
      </div>

      <div v-if="validationErrors.length" class="trust-panel course-warning">
        {{ validationErrors[0] }}
      </div>
      <div v-else class="trust-panel">
        {{ course.trustMessage }}
      </div>

      <MapPreview :route-places="routePlaces" />

      <div class="course-meta-grid">
        <div>
          <span>Places</span>
          <strong>{{ routePlaces.length }}</strong>
        </div>
        <div>
          <span>Style</span>
          <strong>{{ course.style }}</strong>
        </div>
        <div>
          <span>Transport</span>
          <strong>{{ course.transport }}</strong>
        </div>
      </div>

      <div v-if="dayTabs.length > 1" class="day-tabs">
        <button v-for="day in dayTabs" :key="day" type="button" :class="{ active: day === selectedDay }" @click="selectedDay = day">
          Day {{ day }}
        </button>
      </div>

      <Timeline :stops="stops" />

      <div class="action-grid result-actions">
        <BaseButton @click="editCourse">코스 편집</BaseButton>
        <BaseButton v-if="!isSavedCourse" variant="secondary" @click="saveTemplateCourse">코스 저장</BaseButton>
        <BaseButton variant="secondary" @click="shareCourse">공유</BaseButton>
        <BaseButton variant="secondary" @click="viewAsAiResult">AI 결과로 보기</BaseButton>
      </div>

      <BaseButton v-if="isSavedCourse" variant="danger" block class="course-delete-button" @click="showDeleteSheet = true">
        저장한 코스 삭제
      </BaseButton>

      <div v-if="showDeleteSheet" class="sheet-backdrop" @click="showDeleteSheet = false">
        <div class="bottom-sheet delete-course-sheet" role="dialog" aria-modal="true" aria-label="저장한 코스 삭제" @click.stop>
          <div class="sheet-handle"></div>
          <h2>저장한 코스를 삭제할까요?</h2>
          <p>삭제하면 마이페이지 저장 코스 목록에서 사라집니다. 같은 조건으로 다시 생성하거나 저장할 수 있습니다.</p>
          <div class="sheet-actions two">
            <BaseButton variant="secondary" @click="showDeleteSheet = false">취소</BaseButton>
            <BaseButton variant="danger" @click="deleteCourse">삭제</BaseButton>
          </div>
        </div>
      </div>
    </section>

    <section v-else class="course-detail-screen">
      <EmptyState
        icon="AI"
        :tone="uiStore.routeError ? 'error' : 'route'"
        title="코스를 찾을 수 없습니다"
        :text="uiStore.routeError || '저장 목록에서 삭제되었거나 아직 저장한 코스가 없습니다. 저장한 코스를 다시 선택하거나 새 AI 코스를 만들어보세요.'"
        action-label="저장한 코스 보기"
        action-to="/my/activity/saved-routes"
        secondary-label="새 AI 코스 만들기"
        secondary-to="/ai"
      />
    </section>
  </AppLayout>
</template>
