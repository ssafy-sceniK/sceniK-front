<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import SearchBar from '../components/common/SearchBar.vue';
import ChipGroup from '../components/common/ChipGroup.vue';
import ContentCard from '../components/content/ContentCard.vue';
import EmptyState from '../components/common/EmptyState.vue';
import SortSegmentedControl from '../components/common/SortSegmentedControl.vue';
import { localizeSystemLabel } from '../i18n/systemContent.js';
import { useContentStore } from '../stores/contentStore.js';

const router = useRouter();
const route = useRoute();
const contentStore = useContentStore();
const { t, locale } = useI18n();
const query = ref('');
const category = ref('전체');
const mode = ref('content');
const sort = ref('popular');
const visibleLimit = ref(24);
const restoringQuery = ref(false);
const exploreCategories = computed(() => contentStore.categories.map((item) => ({
  value: item,
  label: item === '전체' ? t('content.category.all') : localizeSystemLabel(item, 'category', t, locale.value),
})));
const sortOptions = computed(() => [
  { value: 'popular', label: t('common.sort.popular') },
  { value: 'latest', label: t('common.sort.latest') },
]);

onMounted(() => {
  restoreQueryState();
  contentStore.load({ size: 50 });
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

function positiveSize(value, fallback = 24) {
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
    size: visibleLimit.value !== 24 ? String(visibleLimit.value) : undefined,
  };
  router.replace({ query: nextQuery });
}

watch([query, category, sort], () => {
  if (restoringQuery.value) return;
  visibleLimit.value = 24;
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
      <SearchBar v-model="query" :placeholder="t('content.list.searchPlaceholder')" @focus="router.push('/search')" />
      <div class="mode-toggle">
        <button :class="{ active: mode === 'content' }" @click="mode = 'content'">{{ t('content.list.contentMode') }}</button>
        <button :class="{ active: mode === 'map' }" @click="router.push('/explore/map')">{{ t('content.list.mapMode') }}</button>
      </div>
      <h3 class="subsection-title">{{ t('content.list.category') }}</h3>
      <ChipGroup v-model="category" :items="exploreCategories" />
      <div class="list-control-row explore-sort-row" :aria-label="t('content.list.sortAria')">
        <span class="list-control-label">{{ t('common.sort.label') }}</span>
        <SortSegmentedControl
          v-model="sort"
          :options="sortOptions"
          :aria-label="t('content.list.sortAria')"
        />
        <span class="list-result-count">{{ t('common.resultCount', { count: sortedContents.length }) }}</span>
      </div>

      <EmptyState
        v-if="contentStore.loading"
        tone="loading"
        compact
        :title="t('content.list.loadingTitle')"
        :text="t('content.list.loadingText')"
      />
      <EmptyState
        v-else-if="contentStore.error"
        icon="!"
        tone="error"
        compact
        :title="t('content.list.errorTitle')"
        :text="contentStore.error"
        :action-label="t('common.retry')"
        @action="contentStore.load()"
      />
      <div v-else class="content-grid">
        <RouterLink v-for="content in visibleContents" :key="content.contentId" :to="`/contents/${content.contentId}`">
          <ContentCard :content="content" />
        </RouterLink>
      </div>
      <div v-if="hasMoreContents" class="load-more-row">
        <button type="button" @click="loadMore">{{ t('common.loadMore') }}</button>
      </div>
      <EmptyState
        v-if="!contentStore.loading && !sortedContents.length"
        icon="?"
        tone="search"
        :title="t('content.list.emptyTitle')"
        :text="t('content.list.emptyText')"
        :action-label="t('content.list.viewAll')"
        @action="resetFilters"
      />
    </section>
  </AppLayout>
</template>
