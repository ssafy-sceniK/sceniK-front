<script setup>
import { computed, onMounted, ref } from 'vue';
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
import { courseTemplates } from '../data/mockData.js';
import { normalizeLocale } from '../i18n/languages.js';
import { localizedNotices } from '../data/notices.js';

const router = useRouter();
const contentStore = useContentStore();
const placeStore = usePlaceStore();
const uiStore = useUiStore();
const { t, locale } = useI18n();
const contentTab = ref('drama');
const routeTab = ref('realtime');
const homePopularRouteLimit = 3;

const HOME_COURSE_DISPLAY = {
  'csv-route-1': {
    ko: { title: '\uc120\uc7ac \uc5c5\uace0 \ud280\uc5b4 \uacbd\uae30 2\uc77c \ucf54\uc2a4', region: '\uacbd\uae30', tags: ['\ub4dc\ub77c\ub9c8', '\uacbd\uae30', '\uc218\uc6d0'] },
    en: { title: 'Lovely Runner 2-Day Gyeonggi Course', region: 'Gyeonggi', tags: ['Drama', 'Gyeonggi', 'Suwon'] },
    ja: { title: 'ソンジェ背負って走れ 京畿2日コース', region: '京畿', tags: ['ドラマ', '京畿', '水原'] },
    'zh-CN': { title: '背着善宰跑 京畿2日行程', region: '京畿', tags: ['电视剧', '京畿', '水原'] },
  },
  'csv-route-2': {
    ko: { title: '\ub208\ubb3c\uc758 \uc5ec\uc655 \uacbd\ubd81 2\uc77c \ucf54\uc2a4', region: '\uacbd\ubd81', tags: ['\ub4dc\ub77c\ub9c8', '\uacbd\ubd81', '\uc11c\uc6b8'] },
    en: { title: 'Queen of Tears 2-Day Gyeongbuk Course', region: 'Gyeongbuk', tags: ['Drama', 'Gyeongbuk', 'Seoul'] },
    ja: { title: '涙の女王 慶北2日コース', region: '慶北', tags: ['ドラマ', '慶北', 'ソウル'] },
    'zh-CN': { title: '泪之女王 庆北2日行程', region: '庆北', tags: ['电视剧', '庆北', '首尔'] },
  },
  'csv-route-3': {
    ko: { title: '\ud3ed\uc2f9 \uc18d\uc558\uc218\ub2e4 \uc81c\uc8fc 2\uc77c \ucf54\uc2a4', region: '\uc81c\uc8fc', tags: ['\ub4dc\ub77c\ub9c8', '\uc81c\uc8fc'] },
    en: { title: 'When Life Gives You Tangerines 2-Day Jeju Course', region: 'Jeju', tags: ['Drama', 'Jeju'] },
    ja: { title: 'おつかれさま 済州2日コース', region: '済州', tags: ['ドラマ', '済州'] },
    'zh-CN': { title: '苦尽柑来遇见你 济州2日行程', region: '济州', tags: ['电视剧', '济州'] },
  },
  'csv-route-4': {
    ko: { title: '\uc624\uc9d5\uc5b4 \uac8c\uc784 \uc11c\uc6b8 2\uc77c \ucf54\uc2a4', region: '\uc11c\uc6b8', tags: ['\ub4dc\ub77c\ub9c8', '\uc11c\uc6b8'] },
    en: { title: 'Squid Game 2-Day Seoul Course', region: 'Seoul', tags: ['Drama', 'Seoul'] },
    ja: { title: 'イカゲーム ソウル2日コース', region: 'ソウル', tags: ['ドラマ', 'ソウル'] },
    'zh-CN': { title: '鱿鱼游戏 首尔2日行程', region: '首尔', tags: ['电视剧', '首尔'] },
  },
  'csv-route-5': {
    ko: { title: '\ub3c4\uae68\ube44 \uac15\uc6d0 2\uc77c \ucf54\uc2a4', region: '\uac15\uc6d0', tags: ['\ub4dc\ub77c\ub9c8', '\uac15\uc6d0', '\uac15\ub989'] },
    en: { title: 'Guardian: The Lonely and Great God 2-Day Gangwon Course', region: 'Gangwon', tags: ['Drama', 'Gangwon', 'Gangneung'] },
    ja: { title: 'トッケビ 江原2日コース', region: '江原', tags: ['ドラマ', '江原', '江陵'] },
    'zh-CN': { title: '鬼怪 江原2日行程', region: '江原', tags: ['电视剧', '江原', '江陵'] },
  },
  'csv-route-6': {
    ko: { title: '\uac2f\ub9c8\uc744 \ucc28\ucc28\ucc28 \uacbd\ubd81 2\uc77c \ucf54\uc2a4', region: '\uacbd\ubd81', tags: ['\ub4dc\ub77c\ub9c8', '\uacbd\ubd81', '\ud3ec\ud56d'] },
    en: { title: 'Hometown Cha-Cha-Cha 2-Day Gyeongbuk Course', region: 'Gyeongbuk', tags: ['Drama', 'Gyeongbuk', 'Pohang'] },
    ja: { title: '海街チャチャチャ 慶北2日コース', region: '慶北', tags: ['ドラマ', '慶北', '浦項'] },
    'zh-CN': { title: '海岸村恰恰恰 庆北2日行程', region: '庆北', tags: ['电视剧', '庆北', '浦项'] },
  },
  'csv-route-7': {
    ko: { title: '\uadf8 \ud574 \uc6b0\ub9ac\ub294 \uacbd\uae30 2\uc77c \ucf54\uc2a4', region: '\uacbd\uae30', tags: ['\ub4dc\ub77c\ub9c8', '\uacbd\uae30', '\uc11c\uc6b8'] },
    en: { title: 'Our Beloved Summer 2-Day Gyeonggi Course', region: 'Gyeonggi', tags: ['Drama', 'Gyeonggi', 'Seoul'] },
    ja: { title: 'その年、私たちは 京畿2日コース', region: '京畿', tags: ['ドラマ', '京畿', 'ソウル'] },
    'zh-CN': { title: '那年，我们的夏天 京畿2日行程', region: '京畿', tags: ['电视剧', '京畿', '首尔'] },
  },
  'csv-route-8': {
    ko: { title: '\uc0ac\ub791\uc758 \ubd88\uc2dc\ucc29 \uacbd\uae30 2\uc77c \ucf54\uc2a4', region: '\uacbd\uae30', tags: ['\ub4dc\ub77c\ub9c8', '\uacbd\uae30', '\ucda9\uc8fc'] },
    en: { title: 'Crash Landing on You 2-Day Gyeonggi Course', region: 'Gyeonggi', tags: ['Drama', 'Gyeonggi', 'Chungju'] },
    ja: { title: '愛の不時着 京畿2日コース', region: '京畿', tags: ['ドラマ', '京畿', '忠州'] },
    'zh-CN': { title: '爱的迫降 京畿2日行程', region: '京畿', tags: ['电视剧', '京畿', '忠州'] },
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

function localizeHomeCourse(course) {
  const targetLocale = currentLocale.value;
  const display = HOME_COURSE_DISPLAY[course.routeId]?.[targetLocale]
    ?? HOME_COURSE_DISPLAY[course.routeId]?.ko;
  return {
    ...course,
    title: display?.title ?? course.title,
    region: display?.region ?? course.region,
    tags: display?.tags ?? (course.tags ?? []),
  };
}

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
