import { defineStore } from 'pinia';
import { fetchIntegratedSearch } from '../api/searchApi.js';
import { i18n } from '../i18n/index.js';

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
        this.results = await fetchIntegratedSearch({ keyword });
      } catch (error) {
        this.results = { contents: [], places: [] };
        this.error = error.userMessage ?? i18n.global.t('errors.searchResultsLoadFailed');
      } finally {
        this.loading = false;
      }
    },
  },
});
