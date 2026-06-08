import { defineStore } from 'pinia';
import { fetchIntegratedSearch } from '../api/searchApi.js';

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
        this.error = error.userMessage ?? '검색 결과를 불러오지 못했습니다.';
      } finally {
        this.loading = false;
      }
    },
  },
});
