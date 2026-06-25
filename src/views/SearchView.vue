<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import SearchBar from '../components/common/SearchBar.vue';
import ContentCard from '../components/content/ContentCard.vue';
import PlaceCard from '../components/place/PlaceCard.vue';
import EmptyState from '../components/common/EmptyState.vue';
import { useSearchStore } from '../stores/searchStore.js';

const searchStore = useSearchStore();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const keyword = ref(searchStore.keyword);
const searchInputRef = ref(null);
const restoringQuery = ref(false);
const hasResults = computed(() => (
  searchStore.results.contents.length + searchStore.results.places.length
) > 0);

function queryValue(value, fallback = '') {
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

function restoreQueryState() {
  restoringQuery.value = true;
  keyword.value = queryValue(route.query.keyword);
  if (keyword.value) searchStore.search(keyword.value);
  queueMicrotask(() => {
    restoringQuery.value = false;
  });
}

function runSearch() {
  searchStore.search(keyword.value);
  if (!restoringQuery.value) {
    router.replace({
      query: {
        ...route.query,
        keyword: keyword.value.trim() || undefined,
      },
    });
  }
}

function clearSearch() {
  keyword.value = '';
  searchStore.search('');
  router.replace({ query: { ...route.query, keyword: undefined } });
}

async function focusSearchInput() {
  await nextTick();
  searchInputRef.value?.focus?.({ preventScroll: true });
}

onMounted(() => {
  restoreQueryState();
  focusSearchInput();
});
watch(() => route.query.keyword, restoreQueryState);
</script>

<template>
  <AppLayout :title="t('search.title')" back>
    <section class="search-screen">
      <SearchBar ref="searchInputRef" v-model="keyword" :placeholder="t('search.placeholder')" @update:model-value="runSearch" />
      <EmptyState
        v-if="!keyword"
        icon="?"
        tone="search"
        :title="t('search.emptyStartTitle')"
        :text="t('search.emptyStartText')"
      />
      <template v-else>
        <EmptyState
          v-if="searchStore.loading"
          tone="loading"
          compact
          :title="t('search.loadingTitle')"
          :text="t('search.loadingText')"
        />
        <EmptyState
          v-else-if="searchStore.error"
          icon="!"
          tone="error"
          :title="t('search.errorTitle')"
          :text="searchStore.error"
          :action-label="t('common.retry')"
          @action="runSearch"
        />
        <EmptyState
          v-else-if="!hasResults"
          icon="?"
          tone="search"
          :title="t('search.noResultsTitle')"
          :text="t('search.noResultsText')"
          :action-label="t('search.clear')"
          @action="clearSearch"
        />
        <template v-else>
          <div class="section-header"><h2>{{ t('search.contentSection') }}</h2></div>
          <div class="content-grid">
            <RouterLink v-for="content in searchStore.results.contents" :key="content.contentId" :to="`/contents/${content.contentId}`">
              <ContentCard :content="content" />
            </RouterLink>
          </div>
          <div class="section-header"><h2>{{ t('search.placeSection') }}</h2></div>
          <div class="stack-list">
            <RouterLink v-for="place in searchStore.results.places" :key="place.placeId" :to="`/places/${place.placeId}`">
              <PlaceCard :place="place" compact />
            </RouterLink>
          </div>
        </template>
      </template>
    </section>
  </AppLayout>
</template>
