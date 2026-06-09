<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import SearchBar from '../components/common/SearchBar.vue';
import ChipGroup from '../components/common/ChipGroup.vue';
import ContentCard from '../components/content/ContentCard.vue';
import BaseButton from '../components/common/BaseButton.vue';
import EmptyState from '../components/common/EmptyState.vue';
import { useContentStore } from '../stores/contentStore.js';
import { useUiStore } from '../stores/uiStore.js';

const router = useRouter();
const contentStore = useContentStore();
const uiStore = useUiStore();
const query = ref('');
const category = ref('전체');

onMounted(() => {
  uiStore.resetAiSelection();
  contentStore.load();
});

const filteredContents = computed(() => contentStore.search({ category: category.value, keyword: query.value }));
const selectedCount = computed(() => uiStore.selectedContentIds?.length ?? 0);
</script>

<template>
  <AppLayout>
    <section class="course-step course-selection-screen">
      <div class="progress-line"><b></b><span>1/4</span></div>
      <div class="page-intro course-selection-intro">
        <h1>어떤 콘텐츠로 여행할까요?</h1>
        <p>드라마·영화·예능을 두 개 이상 함께 선택할 수 있어요.</p>
      </div>
      <SearchBar v-model="query" class="course-selection-search" placeholder="콘텐츠 검색" />
      <ChipGroup v-model="category" class="course-selection-categories" :items="contentStore.categories" />
      <EmptyState
        v-if="contentStore.loading"
        tone="loading"
        compact
        title="콘텐츠를 불러오는 중입니다"
        text="AI 코스에 연결할 K-content를 준비하고 있어요."
      />
      <EmptyState
        v-else-if="contentStore.error"
        icon="!"
        tone="error"
        compact
        title="콘텐츠를 불러오지 못했습니다"
        :text="contentStore.error"
        action-label="다시 시도"
        @action="contentStore.load"
      />
      <div v-else class="content-grid course-selection-grid">
        <button
          v-for="content in filteredContents"
          :key="content.contentId"
          class="unstyled"
          @click="uiStore.toggleSelectedContent(content.contentId)"
        >
          <ContentCard :content="content" :selected="uiStore.selectedContentIds?.includes(content.contentId)" />
        </button>
      </div>
      <EmptyState
        v-if="!contentStore.loading && !contentStore.error && !filteredContents.length"
        icon="AI"
        tone="route"
        compact
        title="선택할 콘텐츠가 없습니다"
        text="검색어를 줄이거나 다른 카테고리에서 여행의 시작점을 찾아보세요."
      />
      <div class="sticky-actions course-selection-actions">
        <div v-if="selectedCount" class="selection-summary">
          {{ selectedCount }}개 콘텐츠 선택됨
        </div>
        <p class="course-crud-hint">생성한 AI 코스는 저장 후 마이페이지에서 수정, 공유, 삭제할 수 있어요.</p>
        <BaseButton class="course-primary-cta" block :disabled="!selectedCount" @click="router.push('/ai/conditions')">
          <span>여행 조건 설정하기<span v-if="selectedCount"> · {{ selectedCount }}개 선택</span></span>
          <small>{{ selectedCount ? '선택한 K-content 기반으로 검증 장소를 찾습니다' : '콘텐츠를 선택하면 다음 단계로 이동할 수 있어요' }}</small>
        </BaseButton>
      </div>
    </section>
  </AppLayout>
</template>
