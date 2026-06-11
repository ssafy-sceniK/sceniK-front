<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import SearchBar from '../components/common/SearchBar.vue';
import ChipGroup from '../components/common/ChipGroup.vue';
import PlaceCard from '../components/place/PlaceCard.vue';
import EmptyState from '../components/common/EmptyState.vue';
import SortSegmentedControl from '../components/common/SortSegmentedControl.vue';
import { usePlaceStore } from '../stores/placeStore.js';

const placeStore = usePlaceStore();
const route = useRoute();
const router = useRouter();
const query = ref('');
const region = ref('전체');
const category = ref('전체');
const sort = ref('latest');
const visibleLimit = ref(12);
const restoringQuery = ref(false);
const sortOptions = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
  { value: 'name', label: '이름순' },
];

onMounted(() => {
  restoreQueryState();
  placeStore.load({ sort: sort.value, size: 50 });
});

const filteredPlaces = computed(() => placeStore.search({
  region: region.value,
  category: category.value,
  keyword: query.value,
}));
const sortedPlaces = computed(() => [...filteredPlaces.value].sort((a, b) => {
  if (sort.value === 'name') return String(a.placeName ?? '').localeCompare(String(b.placeName ?? ''), 'ko');
  if (sort.value === 'popular') return Number(b.likeCount ?? 0) - Number(a.likeCount ?? 0);
  return String(b.placeId ?? '').localeCompare(String(a.placeId ?? ''), 'ko');
}));
const visiblePlaces = computed(() => sortedPlaces.value.slice(0, visibleLimit.value));
const hasMorePlaces = computed(() => visiblePlaces.value.length < sortedPlaces.value.length);

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
  const routeSort = queryValue(route.query.sort, 'latest');
  query.value = queryValue(route.query.keyword);
  region.value = queryValue(route.query.region, '전체');
  category.value = queryValue(route.query.category, '전체');
  sort.value = ['latest', 'popular', 'name'].includes(routeSort) ? routeSort : 'latest';
  visibleLimit.value = positiveSize(route.query.size);
  queueMicrotask(() => {
    restoringQuery.value = false;
  });
}

function syncQueryState() {
  if (restoringQuery.value) return;
  router.replace({
    query: {
      ...route.query,
      keyword: query.value.trim() || undefined,
      region: region.value !== '전체' ? region.value : undefined,
      category: category.value !== '전체' ? category.value : undefined,
      sort: sort.value !== 'latest' ? sort.value : undefined,
      size: visibleLimit.value !== 12 ? String(visibleLimit.value) : undefined,
    },
  });
}

watch([query, region, category, sort], () => {
  if (restoringQuery.value) return;
  visibleLimit.value = 12;
  syncQueryState();
});

watch(visibleLimit, syncQueryState);
watch(() => route.query, restoreQueryState);

function resetFilters() {
  query.value = '';
  region.value = '전체';
  category.value = '전체';
  sort.value = 'latest';
}

function loadMore() {
  visibleLimit.value += 12;
}
</script>

<template>
  <AppLayout title="장소 탐색" back>
    <section class="list-screen">
      <SearchBar v-model="query" placeholder="장소명, 지역, 카테고리 검색" />
      <h3 class="subsection-title">지역</h3>
      <ChipGroup v-model="region" :items="placeStore.regions" />
      <h3 class="subsection-title">카테고리</h3>
      <ChipGroup v-model="category" :items="placeStore.categories" />
      <div class="list-control-row explore-sort-row" aria-label="장소 정렬과 결과 수">
        <span class="list-control-label">정렬</span>
        <SortSegmentedControl
          v-model="sort"
          :options="sortOptions"
          aria-label="장소 정렬"
        />
        <span class="list-result-count">{{ sortedPlaces.length }}개 결과</span>
      </div>
      <EmptyState
        v-if="placeStore.loading"
        tone="loading"
        compact
        title="장소를 불러오는 중입니다"
        text="검증된 촬영지와 여행 장소를 확인하고 있어요."
      />
      <EmptyState
        v-else-if="placeStore.error"
        icon="!"
        tone="error"
        compact
        title="장소를 불러오지 못했습니다"
        :text="placeStore.error"
        action-label="다시 시도"
        @action="placeStore.load"
      />
      <div v-else class="stack-list">
        <RouterLink v-for="place in visiblePlaces" :key="place.placeId" :to="`/places/${place.placeId}`">
          <PlaceCard :place="place" compact />
        </RouterLink>
      </div>
      <div v-if="hasMorePlaces" class="load-more-row">
        <button type="button" @click="loadMore">더 보기</button>
      </div>
      <EmptyState
        v-if="!placeStore.loading && !placeStore.error && !sortedPlaces.length"
        icon="P"
        tone="search"
        title="조건에 맞는 장소가 없습니다"
        text="지역이나 검색어를 바꿔 검증된 촬영지를 다시 찾아보세요."
        action-label="전체 장소 보기"
        @action="resetFilters"
      />
    </section>
  </AppLayout>
</template>
