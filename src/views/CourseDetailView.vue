<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { AnimatePresence, motion } from 'motion-v';
import AppLayout from '../components/layout/AppLayout.vue';
import EmptyState from '../components/common/EmptyState.vue';
import FormStatusNotice from '../components/common/FormStatusNotice.vue';
import CourseDeleteActionSheet from '../components/course/CourseDeleteActionSheet.vue';
import DetailNotFoundPanel from '../components/detail/DetailNotFoundPanel.vue';
import MapPreview from '../components/course/MapPreview.vue';
import Timeline from '../components/course/Timeline.vue';
import { useUiStore } from '../stores/uiStore.js';
import { motionVariants } from '../utils/motion.js';
import { localizePreferenceOption, localizeSystemLabel } from '../i18n/systemContent.js';
import { getPlaceImageUrl } from '../utils/placeImages.js';

const route = useRoute();
const router = useRouter();
const uiStore = useUiStore();
const { t, locale } = useI18n();
const selectedDay = ref(1);
const showDeleteSheet = ref(false);
const loadingDetail = ref(false);
const actionNotice = ref(null);
const showActionMenu = ref(false);

const routeId = computed(() => route.params.routeId ?? '');
const isMyCourseRoute = computed(() => route.path.startsWith('/my/course-manage'));
const detail = computed(() => uiStore.resolveCourseDetail(routeId.value));
const course = computed(() => detail.value?.route ?? null);
const isSavedCourse = computed(() => detail.value?.source === 'saved');
const canManageCourse = computed(() => Boolean(course.value?.canEdit || isSavedCourse.value));
const canCopyCourse = computed(() => Boolean(course.value?.canCopy) && !canManageCourse.value);
const canSaveTemplateCourse = computed(() => !isSavedCourse.value && !canCopyCourse.value);
const shouldRequireLogin = computed(() => isMyCourseRoute.value && !uiStore.currentUser);
const validationErrors = computed(() => detail.value?.validation?.errors ?? []);
const displayValidationErrors = computed(() => validationErrors.value.filter((message) => !isMissingTravelTipMessage(message)));
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
const routePlaceIds = computed(() => [...new Set(routePlaces.value.map((place) => place.placeId).filter(Boolean))]);
const selectedDayRoutePlaces = computed(() => stops.value);
const displayRegionLabel = computed(() => localizeRegion(firstText(course.value?.region, routePlaces.value.find((place) => place.region)?.region)) || t('course.detail.unselectedRegion'));
const displayDurationLabel = computed(() => t('course.detail.durationDays', { count: Number(course.value?.durationDays ?? dayTabs.value.length ?? 1) || 1 }));
const displayTransportLabel = computed(() => localizeTransport(firstText(course.value?.transport)) || t('course.detail.transportFallback'));
const travelStyleChips = computed(() => {
  const styles = Array.isArray(course.value?.travelStyles) && course.value.travelStyles.length
    ? course.value.travelStyles
    : splitDisplayList(course.value?.style);
  return [...new Set(styles.map((style) => localizeTravelStyle(style)).filter(Boolean))];
});
const courseDetailChips = computed(() => [
  displayRegionLabel.value,
  displayDurationLabel.value,
  displayTransportLabel.value,
  t('course.detail.placeCount', { count: routePlaces.value.length }),
  ...travelStyleChips.value,
].filter(Boolean));
const courseSummaryText = computed(() => {
  const summary = String(course.value?.summary ?? '').trim();
  if (summary && summary.length <= 72 && !isInternalCourseCopy(summary)) return summary;
  return '';
});
const deleteLoading = computed(() => uiStore.routeActionLoading && showDeleteSheet.value);
const allCoursePlacesTracked = computed(() => Boolean(routePlaceIds.value.length)
  && routePlaceIds.value.every((placeId) => uiStore.plannedVisits.includes(placeId) || uiStore.completedVisits.includes(placeId)));
const allCoursePlacesCompleted = computed(() => Boolean(routePlaceIds.value.length)
  && routePlaceIds.value.every((placeId) => uiStore.completedVisits.includes(placeId)));
const courseVisitActionDisabled = computed(() => uiStore.engagementLoading || !routePlaceIds.value.length || allCoursePlacesCompleted.value);
const courseVisitActionLabel = computed(() => {
  if (allCoursePlacesCompleted.value) return t('course.detail.bulkVisitDone');
  return allCoursePlacesTracked.value ? t('course.detail.bulkVisitCompleted') : t('course.detail.bulkVisitPlanned');
});

function firstText(...values) {
  return values.find((value) => value !== undefined && value !== null && String(value).trim() !== '') ?? '';
}

function splitDisplayList(value) {
  return String(value ?? '')
    .split(/[,/?]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function localizeRegion(value) {
  return localizeSystemLabel(value, 'region', t, locale.value);
}

function localizeTravelStyle(value) {
  return localizePreferenceOption('themes', value, t, locale.value);
}

function localizeTransport(value) {
  const source = String(value ?? '').trim();
  if (!source) return '';
  const lower = source.toLowerCase();
  if (source === 'PUBLIC_TRANSIT' || lower.includes('public') || source.includes('\ub300\uc911')) return t('aiCourse.transport.PUBLIC_TRANSIT');
  if (source === 'CAR' || lower.includes('car') || source.includes('\ucc28')) return t('aiCourse.transport.CAR');
  return source;
}

function enrichStop(stop = {}) {
  const candidate = routeCandidateMap.value.get(stop.placeId) ?? {};
  const placeName = firstText(stop.placeName, stop.name, candidate.placeName, candidate.name, t('course.detail.placeFallback'));
  const category = firstText(stop.category, stop.placeCategory, stop.type, candidate.category);
  return {
    ...candidate,
    ...stop,
    name: firstText(stop.name, stop.placeName, candidate.name, candidate.placeName, placeName),
    placeName,
    category: category ? localizeSystemLabel(category, 'category', t, locale.value) : t('course.detail.placeFallback'),
    address: firstText(stop.address, candidate.address),
    region: localizeRegion(firstText(stop.region, candidate.region)),
    district: firstText(stop.district, candidate.district),
    latitude: firstText(stop.latitude, candidate.latitude),
    longitude: firstText(stop.longitude, candidate.longitude),
    imageUrl: firstText(getPlaceImageUrl(stop), getPlaceImageUrl(candidate)),
  };
}

function isMissingTravelTipMessage(value) {
  return /^Missing\s+travelTip\s+for\s+day\s+\d+\.?$/i.test(String(value ?? '').trim());
}

function isInternalCourseCopy(value) {
  if (!value) return false;
  return /C_[A-Z]+_\d+/.test(value)
    || /contentId|routeId|Course CRUD|AI Course template/i.test(value)
    || /sceniK DB|verified places connected|This course uses only verified|Missing travelTip/i.test(value);
}

async function loadDetail() {
  if (!isMyCourseRoute.value && !routeId.value) return;
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

  if (canManageCourse.value && course.value.routeId) {
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
    title: t('course.detail.saveProgressTitle'),
    text: t('course.detail.saveProgressText'),
  };
  const saved = await uiStore.saveCourse(course.value);
  actionNotice.value = saved
    ? {
        tone: 'success',
        title: t('course.detail.saveSuccessTitle'),
        text: t('course.detail.saveSuccessText'),
      }
    : {
        tone: 'error',
        title: t('course.detail.saveFailedTitle'),
        text: uiStore.routeError || t('course.detail.saveFailedText'),
      };
}

async function copyCourseToMine() {
  if (!course.value?.routeId) return;
  actionNotice.value = {
    tone: 'info',
    title: t('course.detail.copyProgressTitle'),
    text: t('course.detail.copyProgressText'),
  };
  const copied = await uiStore.copySavedCourse(course.value.routeId);
  if (!copied) {
    actionNotice.value = {
      tone: 'error',
      title: t('course.detail.copyFailedTitle'),
      text: uiStore.routeError || t('course.detail.copyFailed'),
    };
    return;
  }
  actionNotice.value = {
    tone: 'success',
    title: t('course.detail.copySuccessTitle'),
    text: t('course.detail.copySuccessText'),
  };
  window.setTimeout(() => router.replace({ name: 'my-course-manage', params: { routeId: copied.routeId } }), 350);
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

function courseShareRouteId() {
  const id = firstText(course.value?.routeId, routeId.value);
  return id && !String(id).startsWith('gen-') ? String(id) : '';
}

function courseShareUrl() {
  const id = courseShareRouteId();
  if (!id || typeof window === 'undefined') return '';
  return new URL(router.resolve({ name: 'course-detail', params: { routeId: id } }).href, window.location.origin).toString();
}

async function copyCourseLink() {
  const url = courseShareUrl();
  if (!url || !navigator.clipboard?.writeText) {
    uiStore.notify(t('course.detail.copyLinkFailed'));
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    uiStore.notify(t('course.detail.linkCopied'), 'success');
  } catch {
    uiStore.notify(t('course.detail.copyLinkFailed'));
  }
}

async function shareCourse() {
  if (!uiStore.requireAuth(t('course.detail.shareLoginRequired'))) return;
  if (!course.value) return;
  const url = courseShareUrl();
  if (!url) {
    uiStore.notify(t('course.detail.shareUnavailable'));
    return;
  }

  const payload = {
    title: course.value.title,
    text: courseSummaryText.value,
    url,
  };

  try {
    if (navigator.share) {
      await navigator.share(payload);
    } else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(payload.url);
    }
    actionNotice.value = null;
    uiStore.notify(t('course.detail.shareSuccess'), 'success');
  } catch (error) {
    if (error?.name === 'AbortError') return;
    uiStore.notify(t('course.detail.shareFailed'));
  }
}

async function markCoursePlacesVisitStatus() {
  if (!uiStore.requireAuth(t('course.detail.shareLoginRequired'))) return;
  const placeIds = routePlaceIds.value;
  if (!placeIds.length || allCoursePlacesCompleted.value) return;
  const targetStatus = allCoursePlacesTracked.value ? 'completed' : 'planned';
  actionNotice.value = {
    tone: 'info',
    title: t('course.detail.bulkVisitProgressTitle'),
    text: t('course.detail.bulkVisitProgressText', { count: placeIds.length }),
  };
  for (const placeId of placeIds) {
    await uiStore.setVisit(placeId, targetStatus);
  }
  actionNotice.value = {
    tone: 'success',
    title: t('course.detail.bulkVisitSuccessTitle'),
    text: t('course.detail.bulkVisitSuccessText', { count: placeIds.length }),
  };
}

async function deleteCourse() {
  if (!canManageCourse.value || !course.value?.routeId) return;
  actionNotice.value = {
    tone: 'info',
    title: t('course.detail.deleteProgressTitle'),
    text: t('course.detail.deleteProgressText'),
  };
  const deleted = await uiStore.deleteSavedCourse(course.value.routeId);
  if (!deleted) {
    actionNotice.value = {
      tone: 'error',
      title: t('course.detail.deleteFailedTitle'),
      text: uiStore.routeError || t('course.detail.deleteFailedText'),
    };
    return;
  }
  actionNotice.value = {
    tone: 'success',
    title: t('course.detail.deleteSuccessTitle'),
    text: t('course.detail.deleteSuccessText'),
  };
  showDeleteSheet.value = false;
  window.setTimeout(() => router.replace('/my/activity/saved-routes'), 450);
}
</script>

<template>
  <AppLayout :title="t('course.detail.title')" back>
    <template #actions>
      <div v-if="course" class="course-detail-menu">
        <button
          type="button"
          class="result-menu-button course-detail-menu__trigger"
          :aria-label="t('course.detail.menuAria')"
          aria-haspopup="menu"
          :aria-expanded="showActionMenu"
          @click="showActionMenu = !showActionMenu"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" /></svg>
        </button>
        <AnimatePresence>
          <motion.div v-if="showActionMenu" class="result-menu-backdrop course-detail-menu__overlay" v-bind="motionVariants.backdrop()" @click="closeActionMenu"></motion.div>
          <motion.div v-if="showActionMenu" class="result-menu-popover course-detail-menu__popover" role="menu" v-bind="motionVariants.popover()">
            <button v-if="canManageCourse" type="button" role="menuitem" @click="runCourseAction(editCourse)">
              <span class="result-menu-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" /><path d="m14 7 3 3" /></svg></span>
              {{ t('common.edit') }}
            </button>
            <button type="button" role="menuitem" @click="runCourseAction(shareCourse)">
              <span class="result-menu-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 10.8 6.8-4.1M8.6 13.2l6.8 4.1" /></svg></span>
              {{ t('common.share') }}
            </button>
            <button type="button" role="menuitem" @click="runCourseAction(copyCourseLink)">
              <span class="result-menu-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" /><path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.1-1.1" /></svg></span>
              {{ t('course.detail.copyLink') }}
            </button>
            <button type="button" role="menuitem" :disabled="courseVisitActionDisabled" @click="runCourseAction(markCoursePlacesVisitStatus)">
              <span class="result-menu-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 21s7-5.4 7-11.2A7 7 0 0 0 5 9.8C5 15.6 12 21 12 21Z" /><circle cx="12" cy="9.8" r="2.3" /><path d="m9.3 13.2 1.8 1.8 3.8-4.2" /></svg></span>
              {{ courseVisitActionLabel }}
            </button>
            <button v-if="canSaveTemplateCourse" type="button" role="menuitem" :disabled="uiStore.routeActionLoading" @click="runCourseAction(saveTemplateCourse)">
              <span class="result-menu-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M19 21 12 17 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z" /></svg></span>
              {{ uiStore.routeActionLoading ? t('profile.edit.savingShort') : t('common.save') }}
            </button>
            <button v-if="canCopyCourse" type="button" role="menuitem" :disabled="uiStore.routeActionLoading" @click="runCourseAction(copyCourseToMine)">
              <span class="result-menu-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M19 21 12 17 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z" /><path d="M8 7h8" /><path d="M8 11h5" /></svg></span>
              {{ uiStore.routeActionLoading ? t('profile.edit.savingShort') : t('course.detail.saveToMyCourses') }}
            </button>
            <button v-if="canManageCourse" type="button" role="menuitem" @click="runCourseAction(viewAsAiResult)">
              <span class="result-menu-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3v18" /><path d="m5 10 7-7 7 7" /><path d="M5 21h14" /></svg></span>
              {{ t('course.detail.viewAsAiResult') }}
            </button>
            <button v-if="canManageCourse" type="button" role="menuitem" class="danger" :disabled="uiStore.routeActionLoading" @click="openDeleteSheet">
              <span class="result-menu-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="m10 11 .4 6" /><path d="m14 11-.4 6" /><path d="M5 6l1 15h12l1-15" /></svg></span>
              {{ t('common.delete') }}
            </button>
          </motion.div>
        </AnimatePresence>
      </div>
    </template>

    <section v-if="shouldRequireLogin" class="course-detail-screen">
      <EmptyState
        icon="K"
        tone="login"
        :title="t('common.loginRequired')"
        :text="t('course.detail.loginRequiredText')"
        :action-label="t('auth.login.title')"
        action-to="/login"
      />
    </section>

    <section v-else-if="loadingDetail" class="course-detail-screen">
      <EmptyState
        tone="loading"
        compact
        :title="t('course.detail.loadingTitle')"
        :text="t('course.detail.loadingText')"
      />
    </section>

    <section v-else-if="course" class="course-detail-screen">
      <div class="course-manage-header result-hero">
        <span class="badge ai course-detail-badge">{{ isSavedCourse ? t('course.detail.savedBadge') : t('course.detail.recommendedBadge') }}</span>
        <h1>{{ course.title }}</h1>
        <p v-if="courseSummaryText" class="course-detail-summary">{{ courseSummaryText }}</p>
        <div v-if="course.dateRangeLabel" class="result-date">{{ course.dateRangeLabel }}</div>
        <div class="course-detail-chip-list" :aria-label="t('course.detail.infoAria')">
          <span v-for="chip in courseDetailChips" :key="chip" class="course-detail-chip">{{ chip }}</span>
        </div>
      </div>

      <div v-if="displayValidationErrors.length" class="trust-panel course-warning">
        {{ displayValidationErrors[0] }}
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
          {{ t('course.detail.dayLabel', { day }) }}
        </button>
      </div>

      <Timeline :stops="stops" :show-transit-notes="false" />

      <AnimatePresence>
        <CourseDeleteActionSheet
          v-if="showDeleteSheet"
          :loading="deleteLoading"
          @cancel="showDeleteSheet = false"
          @confirm="deleteCourse"
        />
      </AnimatePresence>
    </section>

    <section v-else class="course-detail-screen">
      <DetailNotFoundPanel
        :title="t('course.detail.notFoundTitle')"
        :text="uiStore.routeError || t('course.detail.notFoundText')"
        :list-label="t('course.detail.savedCoursesLink')"
        list-to="/my/activity/saved-routes"
        @retry="loadDetail"
      />
    </section>
  </AppLayout>
</template>
