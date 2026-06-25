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

const HOME_COURSE_TITLE_TRANSLATIONS = {
  'csv-route-1': {
    en: 'Lovely Runner 2-Day Gyeonggi Course',
    ja: 'ソンジェ背負って走れ 京畿2日コース',
    'zh-CN': '背着善宰跑 京畿2日路线',
  },
  'csv-route-2': {
    en: 'Queen of Tears 2-Day Gyeongbuk Course',
    ja: '涙の女王 慶北2日コース',
    'zh-CN': '眼泪女王 庆北2日路线',
  },
  'csv-route-3': {
    en: 'When Life Gives You Tangerines 2-Day Jeju Course',
    ja: 'おつかれさま 済州2日コース',
    'zh-CN': '苦尽柑来遇见你 济州2日路线',
  },
  'csv-route-4': {
    en: 'Squid Game 2-Day Seoul Course',
    ja: 'イカゲーム ソウル2日コース',
    'zh-CN': '鱿鱼游戏 首尔2日路线',
  },
  'csv-route-5': {
    en: 'Guardian: The Lonely and Great God 2-Day Gangwon Course',
    ja: 'トッケビ 江原2日コース',
    'zh-CN': '鬼怪 江原2日路线',
  },
  'csv-route-6': {
    en: 'Hometown Cha-Cha-Cha 2-Day Gyeongbuk Course',
    ja: '海街チャチャチャ 慶北2日コース',
    'zh-CN': '海岸村恰恰恰 庆北2日路线',
  },
  'csv-route-7': {
    en: 'Our Beloved Summer 2-Day Gyeonggi Course',
    ja: 'その年、私たちは 京畿2日コース',
    'zh-CN': '那年，我们的夏天 京畿2日路线',
  },
  'csv-route-8': {
    en: 'Crash Landing on You 2-Day Gyeonggi Course',
    ja: '愛の不時着 京畿2日コース',
    'zh-CN': '爱的迫降 京畿2日路线',
  },
};
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

function localizeHomeCourseTag(tag, targetLocale) {
  const regionLabel = localizeSystemLabel(tag, 'region', t, targetLocale);
  if (regionLabel !== tag) return regionLabel;
  return localizeSystemTag(tag, t, targetLocale);
}

function localizeHomeCourse(course) {
  const targetLocale = currentLocale.value;
  const titleKey = courseTitleCacheKey(course, targetLocale);
  const fallbackTitle = HOME_COURSE_TITLE_TRANSLATIONS[course.routeId]?.[targetLocale] || course.title;
  return {
    ...course,
    title: targetLocale === 'ko' ? course.title : translatedCourseTitles.value[titleKey] || fallbackTitle,
    region: localizeSystemLabel(course.region, 'region', t, targetLocale),
    tags: (course.tags ?? []).map((tag) => localizeHomeCourseTag(tag, targetLocale)),
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
