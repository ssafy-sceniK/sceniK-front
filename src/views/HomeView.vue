<script setup>
import { computed, onMounted, ref } from 'vue';
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
const contentTab = ref('드라마');
const routeTab = ref('실시간');
const homePopularRouteLimit = 3;

onMounted(() => {
  contentStore.load();
  placeStore.load();
});

const recentPlaces = computed(() => uiStore.recentPlaceItems.length ? uiStore.recentPlaceItems : placeStore.items.slice(0, 3));
const contentItems = computed(() => {
  const categoryMap = {
    드라마: '드라마',
    영화: '영화',
    예능: '예능',
    'AI 추천': '',
  };
  return contentStore.search({ category: categoryMap[contentTab.value], popular: contentTab.value === 'AI 추천' ? undefined : true }).slice(0, 6);
});
const routeItems = computed(() => routeTab.value === '지역별'
  ? [...courseTemplates].reverse()
  : courseTemplates);
const visibleRouteItems = computed(() => routeItems.value.slice(0, homePopularRouteLimit));
function openCourse(course) {
  if (!course?.routeId) {
    uiStore.notify('코스 상세를 열 수 없습니다.');
    return;
  }
  if (!uiStore.openCourse(course)) {
    uiStore.notify('\uCF54\uC2A4 \uC0C1\uC138\uB97C \uC5F4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.');
    return;
  }
  router.push({ name: 'course-detail', params: { routeId: course.routeId } });
}
</script>

<template>
  <AppLayout>
    <section class="home-screen">
      <SectionHeader title="최근 본 장소" to="/home/recent-all" />
      <DraggableRail class="recent-place-rail">
        <RouterLink v-for="place in recentPlaces" :key="place.placeId" class="rail-card place-wide" :to="`/places/${place.placeId}`">
          <PlaceCard :place="place" />
        </RouterLink>
      </DraggableRail>

      <div class="section-divider"></div>
      <SectionHeader title="추천 콘텐츠" to="/home/content-all" />
      <ChipGroup v-model="contentTab" :items="['드라마', '영화', '예능', 'AI 추천']" />
      <DraggableRail class="poster-rail">
        <RouterLink v-for="content in contentItems" :key="content.contentId" class="poster-link" :to="`/contents/${content.contentId}`">
          <ContentCard :content="content" />
        </RouterLink>
      </DraggableRail>

      <div class="section-divider"></div>
      <SectionHeader title="인기 여행 코스" to="/home/routes-all" />
      <ChipGroup v-model="routeTab" :items="['실시간', '지역별', '테마별']" />
      <div class="stack-list">
        <button v-for="(course, index) in visibleRouteItems" :key="course.routeId" type="button" class="course-link-card" @click="openCourse(course)">
          <CourseCard :course="course" variant="text" :rank="index + 1" />
        </button>
      </div>

      <div class="section-divider"></div>
      <SectionHeader title="공지사항" to="/notice" />
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
        title="추천 콘텐츠가 없습니다"
        text="필터를 바꾸거나 잠시 뒤 다시 확인해주세요."
        action-label="전체 콘텐츠 보기"
        action-to="/contents"
      />
    </section>
  </AppLayout>
</template>
