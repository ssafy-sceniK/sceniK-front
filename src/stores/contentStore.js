import { defineStore } from 'pinia';
import { fetchContentDetail, fetchContentPlaces, fetchContents } from '../api/contentApi.js';

function filterContents(list, { category, keyword, popular } = {}) {
  const query = (keyword ?? '').trim().toLowerCase();
  return list.filter((content) => {
    const matchesCategory = !category || category === '전체' || content.category === category;
    const matchesPopular = popular === undefined || popular === null || popular === '' ? true : Boolean(content.isPopular) === Boolean(popular);
    const haystack = `${content.title} ${content.category} ${content.subcategory} ${content.description} ${content.castNames} ${(content.tags ?? []).join(' ')}`.toLowerCase();
    return matchesCategory && matchesPopular && (!query || haystack.includes(query));
  });
}

export const useContentStore = defineStore('content', {
  state: () => ({
    items: [],
    loading: false,
    error: '',
  }),
  getters: {
    categories: (state) => ['전체', ...new Set(state.items.map((item) => item.category))],
    popular: (state) => state.items.filter((item) => item.isPopular),
  },
  actions: {
    async load(params = {}) {
      this.loading = true;
      this.error = '';
      try {
        this.items = await fetchContents(params);
      } catch (error) {
        this.items = [];
        this.error = error.userMessage ?? '콘텐츠를 불러오지 못했습니다.';
      } finally {
        this.loading = false;
      }
    },
    search(params = {}) {
      return filterContents(this.items, params);
    },
    async getById(contentId) {
      try {
        const content = await fetchContentDetail(contentId);
        this.items = [content, ...this.items.filter((item) => item.contentId !== content.contentId)];
        return content;
      } catch (error) {
        this.error = error.userMessage ?? '콘텐츠 상세를 불러오지 못했습니다.';
        return null;
      }
    },
    async getRelatedPlaces(contentId) {
      try {
        return await fetchContentPlaces(contentId);
      } catch (error) {
        this.error = error.userMessage ?? '관련 장소를 불러오지 못했습니다.';
        return [];
      }
    },
  },
});
