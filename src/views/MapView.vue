<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import AppLayout from '../components/layout/AppLayout.vue';
import SearchBar from '../components/common/SearchBar.vue';
import ChipGroup from '../components/common/ChipGroup.vue';
import MapPreview from '../components/course/MapPreview.vue';
import EmptyState from '../components/common/EmptyState.vue';
import { localizeSystemLabel } from '../i18n/systemContent.js';
import { usePlaceStore } from '../stores/placeStore.js';

const placeStore = usePlaceStore();
placeStore.prepareExplore();
const { t, locale } = useI18n();
const ALL_FILTER = '전체';
const query = ref('');
const region = ref(ALL_FILTER);
const filterDrag = {
  active: false,
  startX: 0,
  scrollLeft: 0,
  moved: false,
  suppressClick: false,
};

function countedOptions(field) {
  const counts = new Map();
  placeStore.items.forEach((place) => {
    const value = place?.[field];
    if (!value) return;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });
  return [
    ALL_FILTER,
    ...[...counts.entries()]
      .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]), 'ko'))
      .map(([value]) => value),
  ];
}

const regionOptions = computed(() => countedOptions('region').map((item) => ({
  value: item,
  label: item === ALL_FILTER ? t('content.region.all') : localizeSystemLabel(item, 'region', t, locale.value),
})));
const filteredPlaces = computed(() => placeStore.search({
  region: region.value === ALL_FILTER ? undefined : region.value,
  keyword: query.value,
}));

onMounted(() => placeStore.load());

function resetFilters() {
  query.value = '';
  region.value = ALL_FILTER;
}

function onFilterWheel(event) {
  if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
  event.currentTarget.scrollLeft += event.deltaY;
  event.preventDefault();
}

function onFilterPointerDown(event) {
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  filterDrag.active = true;
  filterDrag.startX = event.clientX;
  filterDrag.scrollLeft = event.currentTarget.scrollLeft;
  filterDrag.moved = false;
  filterDrag.suppressClick = false;
}

function onFilterPointerMove(event) {
  if (!filterDrag.active) return;
  const deltaX = event.clientX - filterDrag.startX;
  if (Math.abs(deltaX) > 4) {
    filterDrag.moved = true;
    filterDrag.suppressClick = true;
    event.currentTarget.classList.add('is-dragging');
    if (!event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    }
    event.currentTarget.scrollLeft = filterDrag.scrollLeft - deltaX;
    event.preventDefault();
  }
}

function onFilterPointerUp(event) {
  filterDrag.active = false;
  event.currentTarget.classList.remove('is-dragging');
  if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
    event.currentTarget.releasePointerCapture(event.pointerId);
  }
  window.setTimeout(() => {
    filterDrag.moved = false;
    filterDrag.suppressClick = false;
  }, 120);
}

function onFilterClick(event) {
  if (!filterDrag.suppressClick) return;
  event.preventDefault();
  event.stopPropagation();
  filterDrag.suppressClick = false;
}
</script>

<template>
  <AppLayout>
    <section class="map-screen">
      <SearchBar v-model="query" :placeholder="t('map.searchPlaceholder')" />
      <div class="mode-toggle">
        <RouterLink to="/explore">{{ t('content.list.contentMode') }}</RouterLink>
        <RouterLink class="active" to="/explore/map">{{ t('content.list.mapMode') }}</RouterLink>
      </div>
      <div
        class="map-filter-scroll"
        @wheel="onFilterWheel"
        @pointerdown="onFilterPointerDown"
        @pointermove="onFilterPointerMove"
        @pointerup="onFilterPointerUp"
        @pointercancel="onFilterPointerUp"
        @click.capture="onFilterClick"
      >
        <ChipGroup v-model="region" :items="regionOptions" />
      </div>
      <EmptyState
        v-if="placeStore.loading"
        tone="loading"
        compact
        :title="t('map.loadingTitle')"
        :text="t('map.loadingText')"
      />
      <EmptyState
        v-else-if="placeStore.error"
        icon="!"
        tone="error"
        compact
        :title="t('map.errorTitle')"
        :text="placeStore.error"
        :action-label="t('common.retry')"
        @action="placeStore.load"
      />
      <template v-else>
        <MapPreview class="map-explore-preview" :route-places="filteredPlaces" :draw-path="false" />
      </template>
      <EmptyState
        v-if="!placeStore.loading && !placeStore.error && !filteredPlaces.length"
        icon="P"
        tone="search"
        compact
        :title="t('map.emptyTitle')"
        :text="t('map.emptyText')"
        :action-label="t('place.list.viewAll')"
        @action="resetFilters"
      />
    </section>
  </AppLayout>
</template>
