<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import BaseButton from '../components/common/BaseButton.vue';
import EmptyState from '../components/common/EmptyState.vue';
import FormStatusNotice from '../components/common/FormStatusNotice.vue';
import CourseCrudPanel from '../components/course/CourseCrudPanel.vue';
import CourseDeleteActionSheet from '../components/course/CourseDeleteActionSheet.vue';
import DetailNotFoundPanel from '../components/detail/DetailNotFoundPanel.vue';
import MapPreview from '../components/course/MapPreview.vue';
import RouteProgressSummary from '../components/course/RouteProgressSummary.vue';
import Timeline from '../components/course/Timeline.vue';
import { useUiStore } from '../stores/uiStore.js';

const route = useRoute();
const router = useRouter();
const uiStore = useUiStore();
const selectedDay = ref(1);
const showDeleteSheet = ref(false);
const loadingDetail = ref(false);
const actionNotice = ref(null);

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
const courseSourceLabel = computed(() => (isSavedCourse.value ? 'Saved Course CRUD' : 'AI Course template'));
const courseUpdatedLabel = computed(() => (
  course.value?.updatedAt
  ?? course.value?.createdAt
  ?? course.value?.dateRangeLabel
  ?? (isSavedCourse.value ? '저장한 코스' : '저장 전 템플릿')
));
const courseSummaryText = computed(() => {
  const summary = course.value?.summary?.trim?.() ?? '';
  if (/verified places connected into a sceniK travel course/i.test(summary)) return '';
  return summary;
});
const courseTrustMessage = computed(() => {
  const message = course.value?.trustMessage?.trim?.() ?? '';
  if (/This course uses only verified sceniK places/i.test(message)) return '';
  return message;
});
const deleteLoading = computed(() => uiStore.routeActionLoading && showDeleteSheet.value);

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
    title: '코스를 저장하는 중입니다.',
    text: '선택한 코스를 내 저장 목록에 추가하고 있습니다.',
  };
  const saved = await uiStore.saveCourse(course.value);
  actionNotice.value = saved
    ? {
        tone: 'success',
        title: '저장되었습니다.',
        text: '마이페이지 저장한 코스에서 다시 확인할 수 있습니다.',
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

function shareCourse() {
  if (!uiStore.requireAuth('로그인하면 코스를 공유할 수 있습니다.')) return;
  const text = course.value ? `${course.value.title}\n${course.value.summary}` : 'sceniK course';
  navigator.clipboard?.writeText?.(text)
    .then(() => {
      actionNotice.value = {
        tone: 'success',
        title: '공유 문구를 복사했습니다.',
        text: '메신저나 노트에 붙여넣어 코스를 공유할 수 있습니다.',
      };
      uiStore.notify('공유 문구를 복사했습니다.', 'success');
    })
    .catch(() => {
      actionNotice.value = {
        tone: 'info',
        title: '공유 문구가 준비되었습니다.',
        text: '브라우저 권한 때문에 자동 복사는 제한되었지만 공유할 문구는 준비했습니다.',
      };
      uiStore.notify('공유 문구가 준비되었습니다.');
    });
}

async function deleteCourse() {
  if (!isSavedCourse.value || !course.value?.routeId) return;
  actionNotice.value = {
    tone: 'info',
    title: '코스를 삭제하는 중입니다.',
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
    text: '저장한 코스 목록에서 제거되었습니다.',
  };
  showDeleteSheet.value = false;
  window.setTimeout(() => router.replace('/my/activity/saved-routes'), 450);
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
        <p v-if="courseSummaryText">{{ courseSummaryText }}</p>
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
      <div v-else-if="courseTrustMessage" class="trust-panel">
        {{ courseTrustMessage }}
      </div>

      <FormStatusNotice
        v-if="actionNotice"
        :tone="actionNotice.tone"
        :title="actionNotice.title"
        :text="actionNotice.text"
      />

      <MapPreview :route-places="routePlaces" />

      <RouteProgressSummary
        :places-count="routePlaces.length"
        :duration-days="course.durationDays"
        :transport="course.transport"
        :style-label="course.style"
      />

      <CourseCrudPanel
        title="코스 관리"
        :description="isSavedCourse ? '저장한 코스를 수정, 공유, 삭제할 수 있습니다.' : '저장 전 코스는 먼저 저장하면 내 코스에서 수정과 삭제가 가능합니다.'"
        :course-title="course.title"
        :route-id="course.routeId"
        :source-label="courseSourceLabel"
        :place-count="routePlaces.length"
        :updated-at="courseUpdatedLabel"
      >
        <template #status>
          <FormStatusNotice
            compact
            tone="info"
            :title="isSavedCourse ? '저장된 코스입니다.' : '저장 전 코스입니다.'"
            :text="isSavedCourse ? '내 코스에서 장소 순서와 방문 시간을 수정하고 삭제할 수 있습니다.' : '저장하면 마이페이지의 저장한 AI 코스에서 다시 수정할 수 있습니다.'"
          />
        </template>
        <template #actions>
          <BaseButton @click="editCourse">{{ isSavedCourse ? '코스 수정' : 'AI 결과 편집' }}</BaseButton>
          <BaseButton v-if="!isSavedCourse" variant="secondary" :disabled="uiStore.routeActionLoading" @click="saveTemplateCourse">
            {{ uiStore.routeActionLoading ? '저장 중...' : '코스 저장' }}
          </BaseButton>
          <BaseButton variant="secondary" @click="shareCourse">공유</BaseButton>
          <BaseButton variant="secondary" @click="viewAsAiResult">AI 결과로 보기</BaseButton>
          <BaseButton
            v-if="isSavedCourse"
            variant="danger"
            :disabled="uiStore.routeActionLoading"
            @click="showDeleteSheet = true"
          >
            코스 삭제
          </BaseButton>
        </template>
      </CourseCrudPanel>

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
        :text="uiStore.routeError || '저장 목록에서 삭제되었거나 아직 저장한 코스가 없습니다. 저장한 코스를 다시 선택하거나 새 AI 코스를 만들어보세요.'"
        list-label="저장한 코스 보기"
        list-to="/my/activity/saved-routes"
        @retry="loadDetail"
      />
    </section>
  </AppLayout>
</template>
