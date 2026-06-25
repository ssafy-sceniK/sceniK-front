import { defineStore } from 'pinia';
import { fetchPlaceDetail, fetchPlaces } from '../api/placeApi.js';
import { getPlaceImageUrl } from '../utils/placeImages.js';
import { matchesSearchText, normalizeSearchText } from '../utils/searchText.js';

function filterPlaces(list, { region, district, category, keyword } = {}) {
  const query = normalizeSearchText(keyword);
  return list.filter((place) => {
    const matchesRegion = !region || region === '\uc804\uccb4' || place.region === region;
    const matchesDistrict = !district || place.district === district;
    const matchesCategory = !category || category === '\uc804\uccb4' || place.category === category;
    const searchableValues = [
      place.placeId,
      place.name,
      place.originalName,
      place.placeName,
      place.originalPlaceName,
      place.address,
      place.region,
      place.originalRegion,
      place.district,
      place.originalDistrict,
      place.category,
      place.originalCategory,
      place.description,
      place.originalDescription,
      place.tags,
      place.relatedContents?.map((content) => [content.title, content.originalTitle, content.contentId]),
    ];
    return matchesRegion && matchesDistrict && matchesCategory && matchesSearchText(searchableValues, query);
  });
}

function enrichPlace(place) {
  return {
    ...place,
    imageUrl: getPlaceImageUrl(place),
    relatedContentIds: place.relatedContentIds ?? [],
    tags: place.tags ?? [],
    verified: place.verified ?? true,
  };
}

export const usePlaceStore = defineStore('place', {
  state: () => ({
    items: [],
    loading: false,
    error: '',
  }),
  getters: {
    regions: (state) => ['\uc804\uccb4', ...new Set(state.items.map((item) => item.region))],
    categories: (state) => ['\uc804\uccb4', ...new Set(state.items.map((item) => item.category))],
  },
  actions: {
    prepareExplore() {
      this.error = '';
      if (!this.items.length) this.loading = true;
    },
    async load(params = {}) {
      this.loading = true;
      this.error = '';
      try {
        this.items = (await fetchPlaces(params)).map(enrichPlace);
      } catch (error) {
        this.items = [];
        this.error = error.userMessage ?? '\uc7a5\uc18c\ub97c \ubd88\ub7ec\uc624\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4.';
      } finally {
        this.loading = false;
      }
    },
    search(params = {}) {
      return filterPlaces(this.items, params);
    },
    async getById(placeId) {
      try {
        const place = enrichPlace(await fetchPlaceDetail(placeId));
        this.items = [place, ...this.items.filter((item) => item.placeId !== place.placeId)];
        return place;
      } catch (error) {
        this.error = error.userMessage ?? '\uc7a5\uc18c \uc0c1\uc138\ub97c \ubd88\ub7ec\uc624\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4.';
        return null;
      }
    },
  },
});
