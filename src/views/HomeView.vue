<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import SectionHeader from '../components/common/SectionHeader.vue';
import ChipGroup from '../components/common/ChipGroup.vue';
import DraggableRail from '../components/common/DraggableRail.vue';
import ContentCard from '../components/content/ContentCard.vue';
import PlaceCard from '../components/place/PlaceCard.vue';
import CourseCard from '../components/course/CourseCard.vue';
import EmptyState from '../components/common/EmptyState.vue';
import { useContentStore } from '../stores/contentStore.js';
import { usePlaceStore } from '../stores/placeStore.js';
import { useUiStore } from '../stores/uiStore.js';
import { translateResource } from '../api/translationApi.js';
import { courseTemplates } from '../data/mockData.js';
import { normalizeLocale } from '../i18n/languages.js';
import { localizeSystemLabel, localizeSystemTag } from '../i18n/systemContent.js';
import { localizedNotices } from '../data/notices.js';

const router = useRouter();
const contentStore = useContentStore();
const placeStore = usePlaceStore();
const uiStore = useUiStore();
const { t, locale } = useI18n();
const contentTab = ref('drama');
const routeTab = ref('realtime');
const homePopularRouteLimit = 3;
const translatedCourseTitles = ref({});
const courseTitleRequests = new Map();

onMounted(() => {
  contentStore.load();
  placeStore.load();
});

const contentTabs = computed(() => [
  { value: 'drama', label: t('content.category.drama'), categoryKey: 'drama' },
  { value: 'movie', label: t('content.category.movie'), categoryKey: 'movie' },
  { value: 'variety', label: t('content.category.variety'), categoryKey: 'variety' },
  { value: 'ai', label: t('home.tabs.aiRecommended'), categoryKey: '' },
]);
const routeTabs = computed(() => [
  { value: 'realtime', label: t('home.tabs.realtime') },
  { value: 'region', label: t('home.tabs.byRegion') },
  { value: 'theme', label: t('home.tabs.byTheme') },
]);
const activeContentTab = computed(() => contentTabs.value.find((tab) => tab.value === contentTab.value) ?? contentTabs.value[0]);
const recentPlaces = computed(() => uiStore.recentPlaceItems.length ? uiStore.recentPlaceItems : placeStore.items.slice(0, 3));
const contentItems = computed(() => contentStore.search({
  categoryKey: activeContentTab.value.categoryKey,
  popular: contentTab.value === 'ai' ? undefined : true,
}).slice(0, 6));
const routeItems = computed(() => routeTab.value === 'region'
  ? [...courseTemplates].reverse()
  : courseTemplates);
const visibleRawRouteItems = computed(() => routeItems.value.slice(0, homePopularRouteLimit));
const currentLocale = computed(() => normalizeLocale(locale.value) || 'ko');
const visibleRouteItems = computed(() => visibleRawRouteItems.value.map(localizeHomeCourse));
const noticeItems = computed(() => localizedNotices(t));

function courseTitleCacheKey(course, targetLocale = currentLocale.value) {
  return [targetLocale, course.routeId, 'title', course.title].join('::');
}

function localizeHomeCourse(course) {
  const targetLocale = currentLocale.value;
  const titleKey = courseTitleCacheKey(course, targetLocale);
  return {
    ...course,
    title: targetLocale === 'ko' ? course.title : translatedCourseTitles.value[titleKey] || course.title,
    region: localizeSystemLabel(course.region, 'region', t, targetLocale),
    tags: (course.tags ?? []).map((tag) => localizeSystemTag(tag, t, targetLocale)),
  };
}

async function loadCourseTitleTranslation(course) {
  const targetLocale = currentLocale.value;
  if (!course?.title || targetLocale === 'ko') return;
  const cacheKey = courseTitleCacheKey(course, targetLocale);
  if (translatedCourseTitles.value[cacheKey]) return;
  if (courseTitleRequests.has(cacheKey)) return courseTitleRequests.get(cacheKey);
  const request = translateResource({
    resourceType: 'SYSTEM_TEXT',
    resourceId: 'home-course:' + course.routeId,
    field: 'title',
    targetLanguage: targetLocale,
    sourceText: course.title,
    sourceLanguage: 'ko',
  })
    .then((result) => {
      const translated = result?.translatedText;
      if (translated) {
        translatedCourseTitles.value = {
          ...translatedCourseTitles.value,
          [cacheKey]: translated,
        };
      }
    })
    .catch(() => {})
    .finally(() => {
      courseTitleRequests.delete(cacheKey);
    });
  courseTitleRequests.set(cacheKey, request);
  return request;
}

function loadVisibleCourseTranslations() {
  visibleRawRouteItems.value.forEach((course) => {
    void loadCourseTitleTranslation(course);
  });
}

watch([currentLocale, visibleRawRouteItems], loadVisibleCourseTranslations, { immediate: true });


function openCourse(course) {
  if (!course?.routeId) {
    uiStore.notify(t('course.errors.detailUnavailable'));
    return;
  }
  if (!uiStore.openCourse(course)) {
    uiStore.notify(t('course.errors.detailUnavailable'));
    return;
  }
  router.push({ name: 'course-detail', params: { routeId: course.routeId } });
}
</script>

<template>
  <AppLayout>
    <section class="home-screen">
      <SectionHeader :title="t('home.sections.recentPlaces')" to="/home/recent-all" />
      <DraggableRail class="recent-place-rail">
        <RouterLink v-for="place in recentPlaces" :key="place.placeId" class="rail-card place-wide" :to="`/places/${place.placeId}`">
          <PlaceCard :place="place" />
        </RouterLink>
      </DraggableRail>

      <div class="section-divider"></div>
      <SectionHeader :title="t('home.sections.recommendedContent')" to="/home/content-all" />
      <ChipGroup v-model="contentTab" :items="contentTabs" />
      <DraggableRail class="poster-rail">
        <RouterLink v-for="content in contentItems" :key="content.contentId" class="poster-link" :to="`/contents/${content.contentId}`">
          <ContentCard :content="content" />
        </RouterLink>
      </DraggableRail>

      <div class="section-divider"></div>
      <SectionHeader :title="t('home.sections.popularCourses')" to="/home/routes-all" />
      <ChipGroup v-model="routeTab" :items="routeTabs" />
      <div class="stack-list">
        <button v-for="(course, index) in visibleRouteItems" :key="course.routeId" type="button" class="course-link-card" @click="openCourse(course)">
          <CourseCard :course="course" variant="text" :rank="index + 1" hide-generic-ai-tag />
        </button>
      </div>

      <div class="section-divider"></div>
      <SectionHeader :title="t('home.sections.notices')" to="/notice" />
      <div class="notice-list">
        <RouterLink v-for="notice in noticeItems" :key="notice.id" :to="`/notice/${notice.id}`" class="notice-row">
          <span>{{ notice.title }}</span>
          <small>{{ notice.date }}</small>
        </RouterLink>
      </div>

      <EmptyState
        v-if="!contentItems.length"
        icon="?"
        tone="search"
        compact
        :title="t('home.empty.contentTitle')"
        :text="t('home.empty.contentText')"
        :action-label="t('home.empty.viewAllContent')"
        action-to="/contents"
      />
    </section>
  </AppLayout>
</template>
