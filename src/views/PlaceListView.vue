<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import SearchBar from '../components/common/SearchBar.vue';
import ChipGroup from '../components/common/ChipGroup.vue';
import PlaceCard from '../components/place/PlaceCard.vue';
import EmptyState from '../components/common/EmptyState.vue';
import SortSegmentedControl from '../components/common/SortSegmentedControl.vue';
import { localizeSystemLabel } from '../i18n/systemContent.js';
import { usePlaceStore } from '../stores/placeStore.js';

const placeStore = usePlaceStore();
placeStore.prepareExplore();
const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();
const query = ref('');
const region = ref('\uc804\uccb4');
const category = ref('\uc804\uccb4');
const sort = ref('latest');
const visibleLimit = ref(12);
const restoringQuery = ref(false);
const sortOptions = computed(() => [
  { value: 'latest', label: t('common.sort.latest') },
  { value: 'popular', label: t('common.sort.popular') },
  { value: 'name', label: t('common.sort.name') },
]);
const regionOptions = computed(() => placeStore.regions.map((item) => ({
  value: item,
  label: item === t('place.cleanup.ka2fea217a7') ? t('content.region.all') : localizeSystemLabel(item, 'region', t, locale.value),
})));
const categoryOptions = computed(() => placeStore.categories.map((item) => ({
  value: item,
  label: item === t('place.cleanup.ka2fea217a7') ? t('content.category.all') : localizeSystemLabel(item, 'category', t, locale.value),
})));

function loadPlaces() {
  placeStore.load({ sort: sort.value, size: 50 });
}

onMounted(() => {
  placeStore.prepareExplore();
  restoreQueryState();
  loadPlaces();
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
  region.value = queryValue(route.query.region, '\uc804\uccb4');
  category.value = queryValue(route.query.category, '\uc804\uccb4');
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
      region: region.value !== '\uc804\uccb4' ? region.value : undefined,
      category: category.value !== '\uc804\uccb4' ? category.value : undefined,
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
  region.value = '\uc804\uccb4';
  category.value = '\uc804\uccb4';
  sort.value = 'latest';
}

function loadMore() {
  visibleLimit.value += 12;
}
</script>

<template>
  <AppLayout :title="t('place.list.title')" back>
    <section class="list-screen">
      <SearchBar v-model="query" :placeholder="t('place.list.searchPlaceholder')" />
      <h3 class="subsection-title">{{ t('place.list.region') }}</h3>
      <ChipGroup v-model="region" :items="regionOptions" />
      <h3 class="subsection-title">{{ t('place.list.category') }}</h3>
      <ChipGroup v-model="category" :items="categoryOptions" />
      <div class="list-control-row explore-sort-row" :aria-label="t('place.list.sortAria')">
        <span class="list-control-label">{{ t('common.sort.label') }}</span>
        <SortSegmentedControl
          v-model="sort"
          :options="sortOptions"
          :aria-label="t('place.list.sortAria')"
        />
        <span class="list-result-count">{{ t('common.resultCount', { count: sortedPlaces.length }) }}</span>
      </div>
      <EmptyState
        v-if="placeStore.loading"
        tone="loading"
        compact
        :title="t('place.list.loadingTitle')"
        :text="t('place.list.loadingText')"
      />
      <EmptyState
        v-else-if="placeStore.error"
        icon="!"
        tone="error"
        compact
        :title="t('place.list.errorTitle')"
        :text="placeStore.error"
        :action-label="t('common.retry')"
        @action="loadPlaces"
      />
      <div v-else class="stack-list">
        <RouterLink v-for="place in visiblePlaces" :key="place.placeId" :to="`/places/${place.placeId}`">
          <PlaceCard :place="place" compact />
        </RouterLink>
      </div>
      <div v-if="hasMorePlaces" class="load-more-row">
        <button type="button" @click="loadMore">{{ t('common.loadMore') }}</button>
      </div>
      <EmptyState
        v-if="!placeStore.loading && !placeStore.error && !sortedPlaces.length"
        icon="P"
        tone="search"
        :title="t('place.list.emptyTitle')"
        :text="t('place.list.emptyText')"
        :action-label="t('place.list.viewAll')"
        @action="resetFilters"
      />
    </section>
  </AppLayout>
</template>
