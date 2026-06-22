import { defineStore } from 'pinia';
import { fetchPlaceDetail, fetchPlaces } from '../api/placeApi.js';

function filterPlaces(list, { region, district, category, keyword } = {}) {
  const query = (keyword ?? '').trim().toLowerCase();
  return list.filter((place) => {
    const matchesRegion = !region || region === '전체' || place.region === region;
    const matchesDistrict = !district || place.district === district;
    const matchesCategory = !category || category === '전체' || place.category === category;
    const haystack = `${place.placeName} ${place.region} ${place.district} ${place.category} ${place.description} ${(place.tags ?? []).join(' ')}`.toLowerCase();
    return matchesRegion && matchesDistrict && matchesCategory && (!query || haystack.includes(query));
  });
}

function enrichPlace(place) {
  return {
    ...place,
    imageUrl: place.imageUrl || '/images/seoul-street.jpg',
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
    regions: (state) => ['전체', ...new Set(state.items.map((item) => item.region))],
    categories: (state) => ['전체', ...new Set(state.items.map((item) => item.category))],
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
        this.error = error.userMessage ?? '장소를 불러오지 못했습니다.';
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
        this.error = error.userMessage ?? '장소 상세를 불러오지 못했습니다.';
        return null;
      }
    },
  },
});
