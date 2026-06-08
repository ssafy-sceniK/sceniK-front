<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import BaseButton from '../components/common/BaseButton.vue';
import EmptyState from '../components/common/EmptyState.vue';
import MapPreview from '../components/course/MapPreview.vue';
import { usePlaceStore } from '../stores/placeStore.js';
import { useUiStore } from '../stores/uiStore.js';

const route = useRoute();
const router = useRouter();
const placeStore = usePlaceStore();
const uiStore = useUiStore();
const place = ref(null);
const loading = ref(false);
const errorMessage = ref('');
const placeId = computed(() => route.params.id || '');
const relatedContents = computed(() => place.value?.relatedContents ?? []);
const liked = computed(() => place.value && uiStore.likedPlaces.includes(place.value.placeId));

async function loadPlaceDetail() {
  if (!placeId.value) {
    errorMessage.value = '장소 정보를 찾을 수 없습니다.';
    return;
  }
  loading.value = true;
  errorMessage.value = '';
  place.value = await placeStore.getById(placeId.value);
  if (!place.value) {
    errorMessage.value = placeStore.error || '장소 정보를 불러오지 못했습니다.';
    loading.value = false;
    return;
  }
  uiStore.markViewedPlace(place.value.placeId, place.value);
  loading.value = false;
}

onMounted(loadPlaceDetail);

function startCourse() {
  const firstContent = relatedContents.value[0];
  uiStore.setAiSelection(firstContent ? [firstContent.contentId] : []);
  router.push('/ai/conditions');
}

function useFallbackImage(event) {
  if (event.currentTarget.dataset.fallbackApplied) return;
  event.currentTarget.dataset.fallbackApplied = 'true';
  event.currentTarget.src = '/images/seoul-street.jpg';
}
</script>

<template>
  <AppLayout title="장소 상세" back>
    <template #actions>
      <button
        class="icon-button heart-button"
        :class="{ active: liked }"
        type="button"
        aria-label="좋아요"
        @click="place && uiStore.togglePlaceLike(place.placeId)"
      >
        ♥
      </button>
    </template>

    <EmptyState
      v-if="loading"
      tone="loading"
      compact
      title="장소를 불러오는 중입니다"
      text="검증된 촬영지와 지도 정보를 확인하고 있어요."
    />
    <EmptyState
      v-else-if="errorMessage"
      icon="!"
      tone="error"
      compact
      title="장소를 불러오지 못했습니다"
      :text="errorMessage"
      action-label="다시 시도"
      @action="loadPlaceDetail"
    />
    <section v-else-if="place" class="detail-screen">
      <div class="detail-hero place">
        <img :src="place.imageUrl" :alt="place.placeName" @error="useFallbackImage" />
        <div>
          <span class="badge verified">검증된 장소</span>
          <h1>{{ place.placeName }}</h1>
          <p>{{ place.region }} · {{ place.district }} · {{ place.category }}</p>
        </div>
      </div>
      <div class="detail-body">
        <p>{{ place.description }}</p>
        <p class="meta-line">{{ place.address }}</p>
        <p class="meta-line">운영 시간: {{ place.openingHours }}</p>
        <MapPreview :route-places="[place]" />
        <div class="action-grid two">
          <BaseButton
            :variant="uiStore.plannedVisits.includes(place.placeId) ? 'primary' : 'secondary'"
            @click="uiStore.setVisit(place.placeId, 'planned')"
          >
            방문 예정
          </BaseButton>
          <BaseButton
            :variant="uiStore.completedVisits.includes(place.placeId) ? 'primary' : 'secondary'"
            @click="uiStore.setVisit(place.placeId, 'completed')"
          >
            방문 완료
          </BaseButton>
        </div>
      </div>

      <div class="section-header"><h2>관련 콘텐츠</h2></div>
      <div class="chip-row wrap">
        <RouterLink v-for="content in relatedContents" :key="content.contentId" class="chip" :to="`/contents/${content.contentId}`">
          {{ content.title }}
        </RouterLink>
      </div>
      <div class="sticky-actions">
        <BaseButton block @click="startCourse">이 장소로 AI Course 만들기</BaseButton>
      </div>
    </section>
  </AppLayout>
</template>
