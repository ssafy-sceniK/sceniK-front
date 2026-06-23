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
import { courseTemplates, notices } from '../data/mockData.js';

const router = useRouter();
const contentStore = useContentStore();
const placeStore = usePlaceStore();
const uiStore = useUiStore();
const { t } = useI18n();
const contentTab = ref('drama');
const routeTab = ref('realtime');
const homePopularRouteLimit = 3;

onMounted(() => {
  contentStore.load();
  placeStore.load();
});

const contentTabs = computed(() => [
  { value: 'drama', label: t('content.category.drama'), category: '드라마' },
  { value: 'movie', label: t('content.category.movie'), category: '영화' },
  { value: 'variety', label: t('content.category.variety'), category: '예능' },
  { value: 'ai', label: t('home.tabs.aiRecommended'), category: '' },
]);
const routeTabs = computed(() => [
  { value: 'realtime', label: t('home.tabs.realtime') },
  { value: 'region', label: t('home.tabs.byRegion') },
  { value: 'theme', label: t('home.tabs.byTheme') },
]);
const activeContentTab = computed(() => contentTabs.value.find((tab) => tab.value === contentTab.value) ?? contentTabs.value[0]);
const recentPlaces = computed(() => uiStore.recentPlaceItems.length ? uiStore.recentPlaceItems : placeStore.items.slice(0, 3));
const contentItems = computed(() => contentStore.search({
  category: activeContentTab.value.category,
  popular: contentTab.value === 'ai' ? undefined : true,
}).slice(0, 6));
const routeItems = computed(() => routeTab.value === 'region'
  ? [...courseTemplates].reverse()
  : courseTemplates);
const visibleRouteItems = computed(() => routeItems.value.slice(0, homePopularRouteLimit));

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
          <CourseCard :course="course" variant="text" :rank="index + 1" />
        </button>
      </div>

      <div class="section-divider"></div>
      <SectionHeader :title="t('home.sections.notices')" to="/notice" />
      <div class="notice-list">
        <RouterLink v-for="notice in notices" :key="notice.id" :to="`/notice/${notice.id}`" class="notice-row">
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
