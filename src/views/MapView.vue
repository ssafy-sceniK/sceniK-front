<script setup>
import { computed, onMounted, ref } from 'vue';
import AppLayout from '../components/layout/AppLayout.vue';
import SearchBar from '../components/common/SearchBar.vue';
import ChipGroup from '../components/common/ChipGroup.vue';
import PlaceCard from '../components/place/PlaceCard.vue';
import MapPreview from '../components/course/MapPreview.vue';
import EmptyState from '../components/common/EmptyState.vue';
import { usePlaceStore } from '../stores/placeStore.js';

const placeStore = usePlaceStore();
const query = ref('');
const region = ref('전체');
const filteredPlaces = computed(() => placeStore.search({ region: region.value, keyword: query.value }));

onMounted(() => placeStore.load());

function resetFilters() {
  query.value = '';
  region.value = '전체';
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
      <ChipGroup v-model="region" :items="placeStore.regions" />
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
        <MapPreview :route-places="filteredPlaces" />
        <div class="stack-list">
          <RouterLink v-for="place in filteredPlaces" :key="place.placeId" :to="`/places/${place.placeId}`">
            <PlaceCard :place="place" compact />
          </RouterLink>
        </div>
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
