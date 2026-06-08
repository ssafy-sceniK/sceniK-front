<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import BaseButton from '../components/common/BaseButton.vue';
import EmptyState from '../components/common/EmptyState.vue';
import PlaceCard from '../components/place/PlaceCard.vue';
import { useContentStore } from '../stores/contentStore.js';
import { useUiStore } from '../stores/uiStore.js';

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
  if (event.currentTarget.dataset.fallbackApplied) return;
  event.currentTarget.dataset.fallbackApplied = 'true';
  event.currentTarget.src = '/images/kdrama-scene.jpg';
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
    <EmptyState
      v-else-if="errorMessage"
      icon="!"
      tone="error"
      compact
      title="콘텐츠를 불러오지 못했습니다"
      :text="errorMessage"
      action-label="다시 시도"
      @action="loadContentDetail"
    />
    <section v-else-if="content" class="detail-screen">
      <div class="detail-hero">
        <img :src="content.thumbnailUrl" :alt="content.title" @error="useFallbackImage" />
        <div>
          <span class="badge dark">{{ content.category }}</span>
          <h1>{{ content.title }}</h1>
          <p>{{ content.subcategory }} · {{ content.releaseYear }} · {{ content.ottPlatform }}</p>
        </div>
      </div>
      <div class="detail-body">
        <p>{{ content.description }}</p>
        <p class="meta-line">출연: {{ content.castNames }}</p>
        <div class="tag-row"><span v-for="tag in content.tags" :key="tag">{{ tag }}</span></div>
        <div class="action-grid single">
          <BaseButton @click="startCourse">AI Course 만들기</BaseButton>
        </div>
      </div>

      <div class="section-header"><h2>관련 장소</h2></div>
      <div class="stack-list">
        <RouterLink v-for="place in relatedPlaces" :key="place.placeId" :to="`/places/${place.placeId}`">
          <PlaceCard :place="place" compact />
        </RouterLink>
      </div>
    </section>
  </AppLayout>
</template>
