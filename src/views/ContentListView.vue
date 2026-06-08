<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import SearchBar from '../components/common/SearchBar.vue';
import ChipGroup from '../components/common/ChipGroup.vue';
import ContentCard from '../components/content/ContentCard.vue';
import EmptyState from '../components/common/EmptyState.vue';
import { useContentStore } from '../stores/contentStore.js';

const router = useRouter();
const contentStore = useContentStore();
const query = ref('');
const category = ref('전체');
const mode = ref('콘텐츠 탐색');
const exploreCategories = computed(() => contentStore.categories);

onMounted(() => {
  contentStore.load();
});

const filteredContents = computed(() => {
  const filterCategory = contentStore.categories.includes(category.value) ? category.value : '전체';
  return contentStore.search({ category: filterCategory, keyword: query.value });
});

function resetFilters() {
  query.value = '';
  category.value = '전체';
}
</script>

<template>
  <AppLayout>
    <section class="explore-screen">
      <SearchBar v-model="query" placeholder="드라마 / 장소 / 배우 / 아이돌 검색" @focus="router.push('/search')" />
      <div class="mode-toggle">
        <button :class="{ active: mode === '콘텐츠 탐색' }" @click="mode = '콘텐츠 탐색'">콘텐츠 탐색</button>
        <button :class="{ active: mode === '지도 탐색' }" @click="router.push('/explore/map')">지도 탐색</button>
      </div>
      <h3 class="subsection-title">카테고리</h3>
      <ChipGroup v-model="category" :items="exploreCategories" />

      <div class="section-header"><h2>인기 콘텐츠</h2></div>
      <EmptyState
        v-if="contentStore.loading"
        tone="loading"
        compact
        title="콘텐츠를 불러오는 중입니다"
        text="인기 K-content 목록을 확인하고 있어요."
      />
      <EmptyState
        v-else-if="contentStore.error"
        icon="!"
        tone="error"
        compact
        title="콘텐츠를 불러오지 못했습니다"
        :text="contentStore.error"
        action-label="다시 시도"
        @action="contentStore.load()"
      />
      <div v-else class="content-grid">
        <RouterLink v-for="content in filteredContents" :key="content.contentId" :to="`/contents/${content.contentId}`">
          <ContentCard :content="content" />
        </RouterLink>
      </div>
      <EmptyState
        v-if="!contentStore.loading && !filteredContents.length"
        icon="?"
        tone="search"
        title="조건에 맞는 콘텐츠가 없습니다"
        text="카테고리나 검색어를 바꿔 다시 찾아보세요."
        action-label="전체 보기"
        @action="resetFilters"
      />
    </section>
  </AppLayout>
</template>
