import { defineStore } from 'pinia';
import { fetchContentDetail, fetchContentPlaces, fetchContents } from '../api/contentApi.js';

const CATEGORY_CODE_ALIASES = new Map([
  ['\ub4dc\ub77c\ub9c8', 'drama'], ['Drama', 'drama'], ['\u30c9\u30e9\u30de', 'drama'], ['\u5267\u96c6', 'drama'], ['\u7535\u89c6\u5267', 'drama'],
  ['\uc601\ud654', 'movie'], ['Movie', 'movie'], ['Film', 'movie'], ['\u6620\u753b', 'movie'], ['\u7535\u5f71', 'movie'],
  ['\uc608\ub2a5', 'variety'], ['Variety', 'variety'], ['\u30d0\u30e9\u30a8\u30c6\u30a3', 'variety'], ['\u7efc\u827a', 'variety'],
  ['\uc544\uc774\ub3cc', 'idol'], ['Idol', 'idol'], ['\u30a2\u30a4\u30c9\u30eb', 'idol'], ['\u5076\u50cf', 'idol'],
  ['\ubc30\uc6b0', 'actor'], ['Actor', 'actor'], ['\u4ff3\u512a', 'actor'], ['\u6f14\u5458', 'actor'],
]);

function categoryCode(value) {
  const source = String(value ?? '').trim();
  return CATEGORY_CODE_ALIASES.get(source) ?? '';
}

function contentCategoryCode(content) {
  return categoryCode(content?.originalCategory) || categoryCode(content?.category);
}

function filterContents(list, { category, categoryKey, keyword, popular } = {}) {
  const query = (keyword ?? '').trim().toLowerCase();
  const requestedCategory = String(category ?? '').trim();
  const requestedCategoryCode = categoryKey || categoryCode(requestedCategory);
  const allCategories = !requestedCategoryCode && (!requestedCategory || requestedCategory === '\uc804\uccb4' || requestedCategory.toLowerCase() === 'all');
  return list.filter((content) => {
    const stableCategory = content.originalCategory ?? content.category;
    const matchesCategory = allCategories
      || (requestedCategoryCode ? contentCategoryCode(content) === requestedCategoryCode : false)
      || (!requestedCategoryCode && (content.category === requestedCategory || stableCategory === requestedCategory));
    const matchesPopular = popular === undefined || popular === null || popular === '' ? true : Boolean(content.isPopular) === Boolean(popular);
    const haystack = [content.title, content.category, content.originalCategory, content.subcategory, content.description, content.castNames, ...(content.tags ?? [])].join(' ').toLowerCase();
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
    categories: (state) => ['\uc804\uccb4', ...new Set(state.items.map((item) => item.category))],
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
        this.error = error.userMessage ?? '\ucf58\ud150\uce20\ub97c \ubd88\ub7ec\uc624\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4.';
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
        this.error = error.userMessage ?? '\ucf58\ud150\uce20 \uc0c1\uc138\ub97c \ubd88\ub7ec\uc624\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4.';
        return null;
      }
    },
    async getRelatedPlaces(contentId) {
      try {
        return await fetchContentPlaces(contentId);
      } catch (error) {
        this.error = error.userMessage ?? '\uad00\ub828 \uc7a5\uc18c\ub97c \ubd88\ub7ec\uc624\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4.';
        return [];
      }
    },
  },
});
