<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import SearchBar from '../components/common/SearchBar.vue';
import ChipGroup from '../components/common/ChipGroup.vue';
import ContentCard from '../components/content/ContentCard.vue';
import EmptyState from '../components/common/EmptyState.vue';
import { useContentStore } from '../stores/contentStore.js';

const router = useRouter();
const route = useRoute();
const contentStore = useContentStore();
const query = ref('');
const category = ref('전체');
const mode = ref('콘텐츠 탐색');
const sort = ref('popular');
const visibleLimit = ref(12);
const restoringQuery = ref(false);
const exploreCategories = computed(() => contentStore.categories);

onMounted(() => {
  restoreQueryState();
  contentStore.load({ sort: sort.value, size: 50 });
});

const filteredContents = computed(() => {
  const filterCategory = contentStore.categories.includes(category.value) ? category.value : '전체';
  return contentStore.search({ category: filterCategory, keyword: query.value });
});
const sortedContents = computed(() => [...filteredContents.value].sort((a, b) => {
  if (sort.value === 'latest') return Number(b.releaseYear ?? 0) - Number(a.releaseYear ?? 0);
  return Number(Boolean(b.isPopular)) - Number(Boolean(a.isPopular))
    || Number(b.releaseYear ?? 0) - Number(a.releaseYear ?? 0);
}));
const visibleContents = computed(() => sortedContents.value.slice(0, visibleLimit.value));
const hasMoreContents = computed(() => visibleContents.value.length < sortedContents.value.length);

function queryValue(value, fallback = '') {
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

function positiveSize(value, fallback = 12) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 12 ? Math.min(60, parsed) : fallback;
}

function restoreQueryState() {
  restoringQuery.value = true;
  const routeSort = queryValue(route.query.sort, 'popular');
  query.value = queryValue(route.query.keyword);
  category.value = queryValue(route.query.category, '전체');
  sort.value = ['popular', 'latest'].includes(routeSort) ? routeSort : 'popular';
  visibleLimit.value = positiveSize(route.query.size);
  queueMicrotask(() => {
    restoringQuery.value = false;
  });
}

function syncQueryState() {
  if (restoringQuery.value) return;
  const nextQuery = {
    ...route.query,
    keyword: query.value.trim() || undefined,
    category: category.value !== '전체' ? category.value : undefined,
    sort: sort.value !== 'popular' ? sort.value : undefined,
    size: visibleLimit.value !== 12 ? String(visibleLimit.value) : undefined,
  };
  router.replace({ query: nextQuery });
}

watch([query, category, sort], () => {
  if (restoringQuery.value) return;
  visibleLimit.value = 12;
  syncQueryState();
});

watch(visibleLimit, syncQueryState);
watch(() => route.query, restoreQueryState);

function resetFilters() {
  query.value = '';
  category.value = '전체';
  sort.value = 'popular';
}

function loadMore() {
  visibleLimit.value += 12;
}
</script>

<template>
  <AppLayout>
    <section class="explore-screen">
      <SearchBar v-model="query" placeholder="드라마 / 장소 / 배우 / 아이돌 검색" @focus="router.push('/search')" />
      <div class="mode-toggle">
        <button :class="{ active: mode === '콘텐츠 탐색' }" @click="mode = '콘텐츠 탐색'">콘텐츠 탐색</button>
        <button :class="{ active: mode === '지도 탐색' }" @click="router.push('/explore/map')">지도 탐색</button>
      </div>
      <h3 class="subsection-title">카테고리</h3>
      <ChipGroup v-model="category" :items="exploreCategories" />
      <div class="list-control-row" aria-label="콘텐츠 정렬과 결과 수">
        <label>
          정렬
          <select v-model="sort" class="sort-select">
            <option value="popular">인기순</option>
            <option value="latest">최신순</option>
          </select>
        </label>
        <span>{{ sortedContents.length }}개 결과</span>
      </div>

      <div class="section-header"><h2>인기 콘텐츠</h2></div>
      <EmptyState
        v-if="contentStore.loading"
        tone="loading"
        compact
        title="콘텐츠를 불러오는 중입니다"
        text="인기 K-content 목록을 확인하고 있어요."
      />
      <EmptyState
        v-else-if="contentStore.error"
        icon="!"
        tone="error"
        compact
        title="콘텐츠를 불러오지 못했습니다"
        :text="contentStore.error"
        action-label="다시 시도"
        @action="contentStore.load()"
      />
      <div v-else class="content-grid">
        <RouterLink v-for="content in visibleContents" :key="content.contentId" :to="`/contents/${content.contentId}`">
          <ContentCard :content="content" />
        </RouterLink>
      </div>
      <div v-if="hasMoreContents" class="load-more-row">
        <button type="button" @click="loadMore">더 보기</button>
      </div>
      <EmptyState
        v-if="!contentStore.loading && !sortedContents.length"
        icon="?"
        tone="search"
        title="조건에 맞는 콘텐츠가 없습니다"
        text="카테고리나 검색어를 바꿔 다시 찾아보세요."
        action-label="전체 보기"
        @action="resetFilters"
      />
    </section>
  </AppLayout>
</template>
