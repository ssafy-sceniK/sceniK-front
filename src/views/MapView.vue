<script setup>
import { computed, onMounted, ref } from 'vue';
import AppLayout from '../components/layout/AppLayout.vue';
import SearchBar from '../components/common/SearchBar.vue';
import ChipGroup from '../components/common/ChipGroup.vue';
import MapPreview from '../components/course/MapPreview.vue';
import EmptyState from '../components/common/EmptyState.vue';
import { usePlaceStore } from '../stores/placeStore.js';

const placeStore = usePlaceStore();
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

const regionOptions = computed(() => countedOptions('region'));
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
      <SearchBar v-model="query" placeholder="장소명 검색 예: 남산타워" />
      <div class="mode-toggle">
        <RouterLink to="/explore">콘텐츠 탐색</RouterLink>
        <RouterLink class="active" to="/explore/map">지도 탐색</RouterLink>
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
        title="지도 장소를 불러오는 중입니다"
        text="검증된 촬영지 좌표를 확인하고 있어요."
      />
      <EmptyState
        v-else-if="placeStore.error"
        icon="!"
        tone="error"
        compact
        title="지도 장소를 불러오지 못했습니다"
        :text="placeStore.error"
        action-label="다시 시도"
        @action="placeStore.load"
      />
      <template v-else>
        <MapPreview class="map-explore-preview" :route-places="filteredPlaces" />
      </template>
      <EmptyState
        v-if="!placeStore.loading && !placeStore.error && !filteredPlaces.length"
        icon="P"
        tone="search"
        compact
        title="표시할 장소가 없습니다"
        text="지역이나 검색어를 바꿔 지도에 표시할 장소를 다시 찾아보세요."
        action-label="전체 장소 보기"
        @action="resetFilters"
      />
    </section>
  </AppLayout>
</template>
