<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import BaseButton from '../components/common/BaseButton.vue';
import EmptyState from '../components/common/EmptyState.vue';
import FavoriteToggleStatus from '../components/common/FavoriteToggleStatus.vue';
import DetailNotFoundPanel from '../components/detail/DetailNotFoundPanel.vue';
import PlaceCard from '../components/place/PlaceCard.vue';
import { useContentStore } from '../stores/contentStore.js';
import { useUiStore } from '../stores/uiStore.js';
import { applyNeutralContentImageFallback, getContentImageUrl } from '../utils/contentImages.js';
import { localizeContent, localizePlace } from '../i18n/systemContent.js';

const route = useRoute();
const router = useRouter();
const contentStore = useContentStore();
const uiStore = useUiStore();
const { t, locale } = useI18n();
const content = ref(null);
const relatedPlaces = ref([]);
const loading = ref(false);
const errorMessage = ref('');

const contentId = computed(() => route.params.id || '');
const liked = computed(() => content.value && uiStore.likedContent.includes(content.value.contentId));
const likePending = computed(() => Boolean(content.value)
  && uiStore.pendingContentLikes.some((id) => String(id) === String(content.value.contentId)));
const displayContent = computed(() => localizeContent(content.value, locale.value, t) ?? content.value);
const categoryLabel = computed(() => displayContent.value?.category ?? '');
const contentMeta = computed(() => [
  displayContent.value?.releaseYear,
  displayContent.value?.ottPlatform,
].filter(Boolean).join(' / '));
const localizedTags = computed(() => displayContent.value?.tags ?? []);
const localizedRelatedPlaces = computed(() => relatedPlaces.value.map((place) => localizePlace(place, locale.value, t)));
const contentImageUrl = computed(() => getContentImageUrl(content.value ?? {}));
const contentHeroStyle = computed(() => ({
  '--detail-hero-image': `url("${String(contentImageUrl.value).replaceAll('"', '\\"')}")`,
}));

async function loadContentDetail() {
  if (!contentId.value) {
    errorMessage.value = t('content.detail.notFoundMessage');
    return;
  }
  loading.value = true;
  errorMessage.value = '';
  content.value = await contentStore.getById(contentId.value);
  if (!content.value) {
    relatedPlaces.value = [];
    errorMessage.value = contentStore.error || t('content.detail.loadFailedMessage');
    loading.value = false;
    return;
  }
  relatedPlaces.value = await contentStore.getRelatedPlaces(contentId.value);
  loading.value = false;
}

onMounted(loadContentDetail);

function startCourse() {
  if (!content.value) return;
  uiStore.setAiSelection([content.value.contentId]);
  router.push('/ai/conditions');
}

function useFallbackImage(event) {
  applyNeutralContentImageFallback(event);
}
</script>

<template>
  <AppLayout :title="t('content.detail.title')" back>
    <template #actions>
      <button
        class="icon-button heart-button"
        :class="{ active: liked }"
        type="button"
        :aria-label="t('content.detail.likeAria')"
        :aria-pressed="liked"
        :disabled="likePending"
        @click="content && uiStore.toggleContentLike(content.contentId)"
      >
        ♥
      </button>
    </template>

    <EmptyState
      v-if="loading"
      tone="loading"
      compact
      :title="t('content.detail.loadingTitle')"
      :text="t('content.detail.loadingText')"
    />
    <DetailNotFoundPanel
      v-else-if="errorMessage"
      :title="t('content.detail.errorTitle')"
      :text="errorMessage"
      :list-label="t('content.detail.backToList')"
      list-to="/contents"
      @retry="loadContentDetail"
    />
    <section v-else-if="content" class="detail-screen content-detail-screen">
      <div class="detail-hero detail-hero--content" :style="contentHeroStyle">
        <img class="detail-hero-poster" :key="contentImageUrl" :src="contentImageUrl" :alt="displayContent.title" @error="useFallbackImage" />
        <div>
          <span class="badge dark">{{ categoryLabel }}</span>
          <h1>{{ displayContent.title }}</h1>
          <p>{{ contentMeta }}</p>
        </div>
      </div>
      <div class="detail-body detail-body--content">
        <p class="content-description">{{ displayContent.description }}</p>
        <p v-if="displayContent.castNames" class="meta-line content-cast-line">{{ t('content.detail.cast', { cast: displayContent.castNames }) }}</p>
        <div v-if="localizedTags.length" class="tag-row"><span v-for="tag in localizedTags" :key="tag">{{ tag }}</span></div>
        <div class="action-grid single">
          <BaseButton @click="startCourse">{{ t('content.detail.createCourse') }}</BaseButton>
        </div>
        <FavoriteToggleStatus
          v-if="likePending"
          :active="Boolean(liked)"
          :pending="likePending"
          active-text=""
          inactive-text=""
          :pending-text="t('content.detail.likeSaving')"
        />
      </div>

      <div class="section-header content-related-header"><h2>{{ t('content.detail.relatedPlaces') }}</h2></div>
      <EmptyState
        v-if="!relatedPlaces.length"
        compact
        :title="t('content.detail.relatedEmptyTitle')"
        :text="t('content.detail.relatedEmptyText')"
      />
      <div v-else class="stack-list">
        <RouterLink v-for="place in localizedRelatedPlaces" :key="place.placeId" :to="`/places/${place.placeId}`">
          <PlaceCard :place="place" compact />
        </RouterLink>
      </div>
    </section>
  </AppLayout>
</template>
