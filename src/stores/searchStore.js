import { defineStore } from 'pinia';
import { fetchIntegratedSearch } from '../api/searchApi.js';
import { i18n } from '../i18n/index.js';
import { normalizeSearchText } from '../utils/searchText.js';
import { useContentStore } from './contentStore.js';
import { usePlaceStore } from './placeStore.js';

const RESULT_LIMIT = 20;

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function mergeById(primary = [], secondary = [], idField) {
  const seen = new Set();
  return [...asArray(primary), ...asArray(secondary)]
    .filter((item) => {
      const id = item?.[idField];
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .slice(0, RESULT_LIMIT);
}

function mergeSearchResults(apiResults = {}, localResults = {}) {
  return {
    contents: mergeById(apiResults.contents, localResults.contents, 'contentId'),
    places: mergeById(apiResults.places, localResults.places, 'placeId'),
  };
}

async function ensureLocalSearchSources(contentStore, placeStore) {
  await Promise.all([
    contentStore.items.length ? Promise.resolve() : contentStore.load({ size: 100 }),
    placeStore.items.length ? Promise.resolve() : placeStore.load({ size: 300 }),
  ]);
}

export const useSearchStore = defineStore('search', {
  state: () => ({
    keyword: '',
    results: { contents: [], places: [] },
    loading: false,
    error: '',
  }),
  actions: {
    async search(keyword) {
      this.keyword = keyword;
      this.loading = true;
      this.error = '';
      try {
        const hasQuery = Boolean(normalizeSearchText(keyword));
        const apiSearch = fetchIntegratedSearch({ keyword });
        if (!hasQuery) {
          this.results = await apiSearch;
          return;
        }

        const contentStore = useContentStore();
        const placeStore = usePlaceStore();
        const localSearch = ensureLocalSearchSources(contentStore, placeStore).then(() => ({
          contents: contentStore.search({ keyword }).slice(0, RESULT_LIMIT),
          places: placeStore.search({ keyword }).slice(0, RESULT_LIMIT),
        }));
        const [apiResult, localResult] = await Promise.allSettled([apiSearch, localSearch]);
        if (apiResult.status === 'rejected' && localResult.status === 'rejected') throw apiResult.reason;
        const apiResults = apiResult.status === 'fulfilled' ? apiResult.value : { contents: [], places: [] };
        const localResults = localResult.status === 'fulfilled' ? localResult.value : { contents: [], places: [] };
        this.results = mergeSearchResults(apiResults, localResults);
      } catch (error) {
        this.results = { contents: [], places: [] };
        this.error = error.userMessage ?? i18n.global.t('errors.searchResultsLoadFailed');
      } finally {
        this.loading = false;
      }
    },
  },
});

export { mergeSearchResults };