<script setup>
import { computed, onMounted, ref } from 'vue';
import AppLayout from '../components/layout/AppLayout.vue';
import SearchBar from '../components/common/SearchBar.vue';
import ChipGroup from '../components/common/ChipGroup.vue';
import PlaceCard from '../components/place/PlaceCard.vue';
import EmptyState from '../components/common/EmptyState.vue';
import { usePlaceStore } from '../stores/placeStore.js';

const placeStore = usePlaceStore();
const query = ref('');
const region = ref('전체');

onMounted(() => placeStore.load());

const filteredPlaces = computed(() => placeStore.search({ region: region.value, keyword: query.value }));

function resetFilters() {
  query.value = '';
  region.value = '전체';
}
</script>

<template>
  <AppLayout title="장소 탐색" back>
    <section class="list-screen">
      <SearchBar v-model="query" placeholder="장소명, 지역, 카테고리 검색" />
      <ChipGroup v-model="region" :items="placeStore.regions" />
      <EmptyState
        v-if="placeStore.loading"
        tone="loading"
        compact
        title="장소를 불러오는 중입니다"
        text="검증된 촬영지와 여행 장소를 확인하고 있어요."
      />
      <EmptyState
        v-else-if="placeStore.error"
        icon="!"
        tone="error"
        compact
        title="장소를 불러오지 못했습니다"
        :text="placeStore.error"
        action-label="다시 시도"
        @action="placeStore.load"
      />
      <div v-else class="stack-list">
        <RouterLink v-for="place in filteredPlaces" :key="place.placeId" :to="`/places/${place.placeId}`">
          <PlaceCard :place="place" compact />
        </RouterLink>
      </div>
      <EmptyState
        v-if="!placeStore.loading && !placeStore.error && !filteredPlaces.length"
        icon="P"
        tone="search"
        title="조건에 맞는 장소가 없습니다"
        text="지역이나 검색어를 바꿔 검증된 촬영지를 다시 찾아보세요."
        action-label="전체 장소 보기"
        @action="resetFilters"
      />
    </section>
  </AppLayout>
</template>
