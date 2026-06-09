<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import BaseButton from '../components/common/BaseButton.vue';
import EmptyState from '../components/common/EmptyState.vue';
import MapPreview from '../components/course/MapPreview.vue';
import {
  createPlaceReview,
  deletePlaceReview,
  fetchPlaceReviews,
  updatePlaceReview,
} from '../api/reviewApi.js';
import { getUserMessage } from '../api/error.js';
import { usePlaceStore } from '../stores/placeStore.js';
import { useUiStore } from '../stores/uiStore.js';

const route = useRoute();
const router = useRouter();
const placeStore = usePlaceStore();
const uiStore = useUiStore();
const place = ref(null);
const loading = ref(false);
const errorMessage = ref('');
const reviews = ref([]);
const reviewLoading = ref(false);
const reviewError = ref('');
const reviewSubmitting = ref(false);
const reviewForm = ref({
  rating: 5,
  content: '',
});
const editingReviewId = ref(null);
const editReviewForm = ref({
  rating: 5,
  content: '',
});
const placeId = computed(() => route.params.id || '');
const relatedContents = computed(() => place.value?.relatedContents ?? []);
const liked = computed(() => place.value && uiStore.likedPlaces.includes(place.value.placeId));
const likePending = computed(() => Boolean(place.value)
  && uiStore.pendingPlaceLikes.some((id) => String(id) === String(place.value.placeId)));
const hasMyReview = computed(() => Boolean(uiStore.currentUser?.userId)
  && reviews.value.some((review) => review.userId === uiStore.currentUser.userId));
const reviewCount = computed(() => reviews.value.length || Number(place.value?.reviewCount ?? 0));
const averageRating = computed(() => {
  const rated = reviews.value.map((review) => Number(review.rating)).filter((rating) => Number.isFinite(rating));
  if (rated.length) return (rated.reduce((sum, rating) => sum + rating, 0) / rated.length).toFixed(1);
  const fromPlace = Number(place.value?.averageRating ?? 0);
  return fromPlace > 0 ? fromPlace.toFixed(1) : '0.0';
});

function isReviewOwner(review) {
  return Boolean(uiStore.currentUser?.userId)
    && String(review?.userId ?? '') === String(uiStore.currentUser.userId);
}

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
  await loadReviews();
  loading.value = false;
}

onMounted(loadPlaceDetail);

async function loadReviews() {
  if (!placeId.value) return;
  reviewLoading.value = true;
  reviewError.value = '';
  try {
    reviews.value = await fetchPlaceReviews(placeId.value);
  } catch (error) {
    reviewError.value = getUserMessage(error, '리뷰를 불러오지 못했습니다.');
    reviews.value = [];
  } finally {
    reviewLoading.value = false;
  }
}

async function submitReview() {
  if (!place.value || reviewSubmitting.value) return;
  if (!uiStore.requireAuth('로그인하면 장소 리뷰를 작성할 수 있습니다.')) return;
  if (!reviewForm.value.content.trim()) {
    reviewError.value = '리뷰 내용을 입력해 주세요.';
    uiStore.notify(reviewError.value);
    return;
  }
  if (Number(reviewForm.value.rating) < 0 || Number(reviewForm.value.rating) > 5) {
    reviewError.value = '평점은 0점부터 5점까지 입력해 주세요.';
    uiStore.notify(reviewError.value);
    return;
  }
  reviewSubmitting.value = true;
  reviewError.value = '';
  try {
    const created = await createPlaceReview(place.value.placeId, {
      rating: Number(reviewForm.value.rating),
      content: reviewForm.value.content,
    });
    reviews.value = [created, ...reviews.value.filter((review) => review.reviewId !== created.reviewId)];
    reviewForm.value = { rating: 5, content: '' };
    uiStore.notify('리뷰를 등록했습니다.');
  } catch (error) {
    reviewError.value = getUserMessage(error, '리뷰를 등록하지 못했습니다.');
  } finally {
    reviewSubmitting.value = false;
  }
}

function startEditReview(review) {
  editingReviewId.value = review.reviewId;
  editReviewForm.value = {
    rating: Number(review.rating ?? 5),
    content: review.content ?? '',
  };
  reviewError.value = '';
}

function cancelEditReview() {
  editingReviewId.value = null;
  editReviewForm.value = { rating: 5, content: '' };
}

async function submitReviewEdit(review) {
  if (!place.value || !review?.reviewId || reviewSubmitting.value) return;
  if (!editReviewForm.value.content.trim()) {
    reviewError.value = '리뷰 내용을 입력해 주세요.';
    uiStore.notify(reviewError.value);
    return;
  }
  if (Number(editReviewForm.value.rating) < 0 || Number(editReviewForm.value.rating) > 5) {
    reviewError.value = '평점은 0점부터 5점까지 입력해 주세요.';
    uiStore.notify(reviewError.value);
    return;
  }
  reviewSubmitting.value = true;
  reviewError.value = '';
  try {
    const updated = await updatePlaceReview(place.value.placeId, review.reviewId, {
      rating: Number(editReviewForm.value.rating),
      content: editReviewForm.value.content,
    });
    reviews.value = reviews.value.map((item) => (item.reviewId === updated.reviewId ? updated : item));
    cancelEditReview();
    uiStore.notify('리뷰를 수정했습니다.');
  } catch (error) {
    reviewError.value = getUserMessage(error, '리뷰를 수정하지 못했습니다.');
  } finally {
    reviewSubmitting.value = false;
  }
}

async function removeReview(review) {
  if (!place.value || !review?.reviewId || reviewSubmitting.value) return;
  if (!window.confirm('리뷰를 삭제할까요?')) return;
  reviewSubmitting.value = true;
  reviewError.value = '';
  try {
    await deletePlaceReview(place.value.placeId, review.reviewId);
    reviews.value = reviews.value.filter((item) => item.reviewId !== review.reviewId);
    if (editingReviewId.value === review.reviewId) cancelEditReview();
    uiStore.notify('리뷰를 삭제했습니다.');
  } catch (error) {
    reviewError.value = getUserMessage(error, '리뷰를 삭제하지 못했습니다.');
  } finally {
    reviewSubmitting.value = false;
  }
}

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
        :aria-pressed="liked"
        :disabled="likePending"
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

      <div class="section-header">
        <h2>방문 리뷰</h2>
        <span>{{ reviewCount }}개<span v-if="reviewCount"> · 평균 ★ {{ averageRating }}</span></span>
      </div>
      <div class="review-summary-panel" aria-label="방문 리뷰 요약">
        <strong>★ {{ averageRating }}</strong>
        <span>{{ reviewCount }}개의 방문 기록</span>
        <small>실제 촬영지를 다녀온 사용자의 분위기, 이동 팁, 검증 의견을 모아 보여줍니다.</small>
      </div>
      <EmptyState
        v-if="reviewLoading"
        tone="loading"
        compact
        title="리뷰를 불러오는 중입니다"
        text="이 장소를 다녀온 여행자의 기록을 확인하고 있어요."
      />
      <EmptyState
        v-else-if="reviewError && !reviews.length"
        icon="!"
        tone="error"
        compact
        title="리뷰를 불러오지 못했습니다"
        :text="reviewError"
        action-label="다시 시도"
        @action="loadReviews"
      />
      <div v-else class="review-list">
        <article v-for="review in reviews" :key="review.reviewId" class="review-row">
          <div class="review-row-head">
            <strong>{{ review.nickname }}</strong>
            <span>★ {{ review.rating }}</span>
          </div>
          <template v-if="editingReviewId === review.reviewId">
            <label class="form-field compact">
              평점
              <input v-model.number="editReviewForm.rating" type="number" min="0" max="5" step="0.5" />
            </label>
            <label class="form-field compact">
              리뷰
              <textarea
                v-model="editReviewForm.content"
                maxlength="500"
                placeholder="리뷰 내용을 입력해 주세요."
              ></textarea>
            </label>
            <div class="review-row-actions">
              <button
                type="button"
                :disabled="reviewSubmitting || !editReviewForm.content.trim()"
                @click="submitReviewEdit(review)"
              >
                저장
              </button>
              <button type="button" :disabled="reviewSubmitting" @click="cancelEditReview">취소</button>
            </div>
          </template>
          <template v-else>
            <p>{{ review.content }}</p>
            <div v-if="isReviewOwner(review)" class="review-row-actions">
              <button type="button" @click="startEditReview(review)">수정</button>
              <button type="button" @click="removeReview(review)">삭제</button>
            </div>
          </template>
        </article>
        <EmptyState
          v-if="!reviews.length"
          icon="R"
          tone="search"
          compact
          title="아직 등록된 리뷰가 없습니다"
          text="이 장소를 다녀왔다면 첫 리뷰를 남겨보세요."
        />
      </div>
      <form v-if="uiStore.currentUser && !hasMyReview" class="review-form" @submit.prevent="submitReview">
        <label class="form-field">
          평점
          <input v-model.number="reviewForm.rating" type="number" min="0" max="5" step="0.5" />
        </label>
        <label class="form-field">
          리뷰
          <textarea v-model="reviewForm.content" maxlength="500" placeholder="장소 분위기, 이동 팁, 촬영지 느낌을 남겨주세요"></textarea>
        </label>
        <p v-if="reviewError" class="form-error">{{ reviewError }}</p>
        <BaseButton block :disabled="reviewSubmitting || !reviewForm.content.trim()">
          {{ reviewSubmitting ? '등록 중...' : '리뷰 등록' }}
        </BaseButton>
      </form>
      <p v-else-if="uiStore.currentUser" class="review-helper">이미 이 장소에 리뷰를 작성했습니다.</p>
      <EmptyState
        v-else
        icon="K"
        tone="login"
        compact
        title="로그인하면 리뷰를 남길 수 있습니다"
        text="방문한 촬영지의 분위기와 이동 팁을 공유해 주세요."
        action-label="로그인하기"
        action-to="/login"
      />

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
