<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import SearchBar from '../components/common/SearchBar.vue';
import ChipGroup from '../components/common/ChipGroup.vue';
import ContentCard from '../components/content/ContentCard.vue';
import BaseButton from '../components/common/BaseButton.vue';
import EmptyState from '../components/common/EmptyState.vue';
import { localizeSystemLabel } from '../i18n/systemContent.js';
import { useContentStore } from '../stores/contentStore.js';
import { useUiStore } from '../stores/uiStore.js';

const router = useRouter();
const contentStore = useContentStore();
const uiStore = useUiStore();
const { t, locale } = useI18n();
const query = ref('');
const category = ref('전체');

onMounted(() => {
  uiStore.resetAiSelection();
  contentStore.load();
});

const categoryOptions = computed(() => contentStore.categories.map((item) => ({
  value: item,
  label: item === '전체' ? t('content.category.all') : localizeSystemLabel(item, 'category', t, locale.value),
})));
const filteredContents = computed(() => contentStore.search({ category: category.value, keyword: query.value }));
const selectedCount = computed(() => uiStore.selectedContentIds?.length ?? 0);
</script>

<template>
  <AppLayout>
    <section class="course-step course-selection-screen">
      <div class="progress-line"><b></b><span>1/4</span></div>
      <div class="page-intro course-selection-intro">
        <h1>{{ t('aiCourse.selection.heading') }}</h1>
        <p>{{ t('aiCourse.selection.subtitle') }}</p>
      </div>
      <SearchBar v-model="query" class="course-selection-search" :placeholder="t('aiCourse.selection.searchPlaceholder')" />
      <ChipGroup v-model="category" class="course-selection-categories" :items="categoryOptions" />
      <EmptyState
        v-if="contentStore.loading"
        tone="loading"
        compact
        :title="t('aiCourse.selection.loadingTitle')"
        :text="t('aiCourse.selection.loadingText')"
      />
      <EmptyState
        v-else-if="contentStore.error"
        icon="!"
        tone="error"
        compact
        :title="t('content.list.errorTitle')"
        :text="contentStore.error"
        :action-label="t('common.retry')"
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
        :title="t('aiCourse.selection.emptyTitle')"
        :text="t('aiCourse.selection.emptyText')"
      />
      <div class="sticky-actions course-selection-actions">
        <div v-if="selectedCount" class="selection-summary">
          {{ t('aiCourse.selection.selectedCount', { count: selectedCount }) }}
        </div>
        <p class="course-crud-hint">{{ t('aiCourse.selection.manageHint') }}</p>
        <BaseButton class="course-primary-cta" block :disabled="!selectedCount" @click="router.push('/ai/conditions')">
          <span>{{ t('aiCourse.selection.next') }}</span>
        </BaseButton>
      </div>
    </section>
  </AppLayout>
</template>
