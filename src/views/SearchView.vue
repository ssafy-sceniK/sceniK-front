<script setup>
import { computed, ref } from 'vue';
import AppLayout from '../components/layout/AppLayout.vue';
import SearchBar from '../components/common/SearchBar.vue';
import ContentCard from '../components/content/ContentCard.vue';
import PlaceCard from '../components/place/PlaceCard.vue';
import EmptyState from '../components/common/EmptyState.vue';
import { useSearchStore } from '../stores/searchStore.js';

const searchStore = useSearchStore();
const keyword = ref(searchStore.keyword);
const hasResults = computed(() => (
  searchStore.results.contents.length + searchStore.results.places.length
) > 0);

function runSearch() {
  searchStore.search(keyword.value);
}

function clearSearch() {
  keyword.value = '';
  searchStore.search('');
}
</script>

<template>
  <AppLayout title="검색" back>
    <section class="search-screen">
      <SearchBar v-model="keyword" placeholder="작품, 장소, 태그를 검색하세요" @update:model-value="runSearch" />
      <EmptyState
        v-if="!keyword"
        icon="?"
        tone="search"
        title="무엇을 찾고 있나요?"
        text="좋아하는 K-content, 촬영 장소, 지역 키워드로 검색해보세요."
      />
      <template v-else>
        <EmptyState
          v-if="searchStore.loading"
          tone="loading"
          compact
          title="검색 중입니다"
          text="콘텐츠와 검증된 장소를 함께 찾고 있어요."
        />
        <EmptyState
          v-else-if="searchStore.error"
          icon="!"
          tone="error"
          title="검색 결과를 불러오지 못했습니다"
          :text="searchStore.error"
          action-label="다시 시도"
          @action="runSearch"
        />
        <EmptyState
          v-else-if="!hasResults"
          icon="?"
          tone="search"
          title="검색 결과가 없습니다"
          text="키워드를 조금 더 짧게 입력하거나 다른 K-content 이름으로 찾아보세요."
          action-label="검색어 지우기"
          @action="clearSearch"
        />
        <template v-else>
          <div class="section-header"><h2>콘텐츠</h2></div>
          <div class="content-grid">
            <RouterLink v-for="content in searchStore.results.contents" :key="content.contentId" :to="`/contents/${content.contentId}`">
              <ContentCard :content="content" />
            </RouterLink>
          </div>
          <div class="section-header"><h2>장소</h2></div>
          <div class="stack-list">
            <RouterLink v-for="place in searchStore.results.places" :key="place.placeId" :to="`/places/${place.placeId}`">
              <PlaceCard :place="place" compact />
            </RouterLink>
          </div>
        </template>
      </template>
    </section>
  </AppLayout>
</template>
