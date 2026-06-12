<script setup>
import { computed, onMounted, ref } from 'vue';
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

const route = useRoute();
const router = useRouter();
const contentStore = useContentStore();
const uiStore = useUiStore();
const content = ref(null);
const relatedPlaces = ref([]);
const loading = ref(false);
const errorMessage = ref('');

const contentId = computed(() => route.params.id || '');
const liked = computed(() => content.value && uiStore.likedContent.includes(content.value.contentId));
const likePending = computed(() => Boolean(content.value)
  && uiStore.pendingContentLikes.some((id) => String(id) === String(content.value.contentId)));
const contentMeta = computed(() => [
  content.value?.releaseYear,
  content.value?.ottPlatform,
].filter(Boolean).join(' · '));
const contentImageUrl = computed(() => getContentImageUrl(content.value ?? {}));
const contentHeroStyle = computed(() => ({
  '--detail-hero-image': `url("${String(contentImageUrl.value).replaceAll('"', '\\"')}")`,
}));

async function loadContentDetail() {
  if (!contentId.value) {
    errorMessage.value = '콘텐츠 정보를 찾을 수 없습니다.';
    return;
  }
  loading.value = true;
  errorMessage.value = '';
  content.value = await contentStore.getById(contentId.value);
  if (!content.value) {
    relatedPlaces.value = [];
    errorMessage.value = contentStore.error || '콘텐츠 정보를 불러오지 못했습니다.';
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
  <AppLayout title="콘텐츠 상세" back>
    <template #actions>
      <button
        class="icon-button heart-button"
        :class="{ active: liked }"
        type="button"
        aria-label="좋아요"
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
      title="콘텐츠를 불러오는 중입니다"
      text="검증된 촬영지 정보를 함께 확인하고 있어요."
    />
    <DetailNotFoundPanel
      v-else-if="errorMessage"
      title="콘텐츠를 불러오지 못했습니다"
      :text="errorMessage"
      list-label="콘텐츠 목록으로 돌아가기"
      list-to="/contents"
      @retry="loadContentDetail"
    />
    <section v-else-if="content" class="detail-screen">
      <div class="detail-hero detail-hero--content" :style="contentHeroStyle">
        <img class="detail-hero-poster" :key="contentImageUrl" :src="contentImageUrl" :alt="content.title" @error="useFallbackImage" />
        <div>
          <span class="badge dark">{{ content.category }}</span>
          <h1>{{ content.title }}</h1>
          <p>{{ contentMeta }}</p>
        </div>
      </div>
      <div class="detail-body detail-body--content">
        <p class="content-description">{{ content.description }}</p>
        <p class="meta-line content-cast-line">출연: {{ content.castNames }}</p>
        <div class="tag-row"><span v-for="tag in content.tags" :key="tag">{{ tag }}</span></div>
        <div class="action-grid single">
          <BaseButton @click="startCourse">AI Course 만들기</BaseButton>
        </div>
        <FavoriteToggleStatus
          v-if="likePending"
          :active="Boolean(liked)"
          :pending="likePending"
          active-text=""
          inactive-text=""
          pending-text="콘텐츠 좋아요 상태를 저장하는 중입니다."
        />
      </div>

      <div class="section-header content-related-header"><h2>관련 장소</h2></div>
      <EmptyState
        v-if="!relatedPlaces.length"
        compact
        title="연결된 촬영지가 아직 없어요"
        text="관련 장소 데이터가 비어 있어도 상세 화면은 그대로 유지됩니다."
      />
      <div v-else class="stack-list">
        <RouterLink v-for="place in relatedPlaces" :key="place.placeId" :to="`/places/${place.placeId}`">
          <PlaceCard :place="place" compact />
        </RouterLink>
      </div>
    </section>
  </AppLayout>
</template>
