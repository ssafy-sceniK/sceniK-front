<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import BaseButton from '../components/common/BaseButton.vue';
import EmptyState from '../components/common/EmptyState.vue';
import FormStatusNotice from '../components/common/FormStatusNotice.vue';
import MapPreview from '../components/course/MapPreview.vue';
import DetailNotFoundPanel from '../components/detail/DetailNotFoundPanel.vue';
import ReviewPanel from '../components/review/ReviewPanel.vue';
import TranslatableText from '../components/translation/TranslatableText.vue';
import {
  createPlaceReview,
  deletePlaceReview,
  fetchPlaceReviews,
  updatePlaceReview,
} from '../api/reviewApi.js';
import { getUserMessage } from '../api/error.js';
import { usePlaceStore } from '../stores/placeStore.js';
import { useUiStore } from '../stores/uiStore.js';
import { localizeContent, localizePlace } from '../i18n/systemContent.js';
import { getPlaceImageUrl } from '../utils/placeImages.js';

const route = useRoute();
const router = useRouter();
const placeStore = usePlaceStore();
const uiStore = useUiStore();
const { t, locale } = useI18n();
const place = ref(null);
const loading = ref(false);
const errorMessage = ref('');
const reviews = ref([]);
const reviewsLoaded = ref(false);
const reviewLoading = ref(false);
const reviewError = ref('');
const reviewNotice = ref(null);
const reviewSubmitting = ref(false);
const reviewForm = ref({
  rating: 5,
  content: '',
});
const placeImageFailed = ref(false);
const editingReviewId = ref(null);
const editReviewForm = ref({
  rating: 5,
  content: '',
});
const ratingOptions = [1, 2, 3, 4, 5];
const placeId = computed(() => route.params.id || '');
const placeImageUrl = computed(() => getPlaceImageUrl(place.value));
const showPlaceImage = computed(() => Boolean(placeImageUrl.value) && !placeImageFailed.value);
const relatedContents = computed(() => place.value?.relatedContents ?? []);
const displayPlace = computed(() => localizePlace(place.value, locale.value, t) ?? place.value);
const placeInitial = computed(() => displayPlace.value?.placeName?.trim?.().slice(0, 1) || 'P');
const localizedRelatedContents = computed(() => relatedContents.value.map((content) => localizeContent(content, locale.value, t)));
const mapRoutePlaces = computed(() => (displayPlace.value ? [displayPlace.value] : []));
const placeMeta = computed(() => [displayPlace.value?.region, displayPlace.value?.district, displayPlace.value?.category].filter(Boolean).join(' \u00b7 '));
const liked = computed(() => place.value && uiStore.likedPlaces.includes(place.value.placeId));
const likePending = computed(() => Boolean(place.value)
  && uiStore.pendingPlaceLikes.some((id) => String(id) === String(place.value.placeId)));
const visitPending = computed(() => Boolean(place.value)
  && uiStore.pendingVisitStatuses.some((id) => String(id) === String(place.value.placeId)));
const hasMyReview = computed(() => Boolean(uiStore.currentUser?.userId)
  && reviews.value.some((review) => review.userId === uiStore.currentUser.userId));
const myReview = computed(() => reviews.value.find((review) => (
  Boolean(uiStore.currentUser?.userId) && String(review.userId) === String(uiStore.currentUser.userId)
)) ?? null);
const reviewCount = computed(() => (
  reviewsLoaded.value ? reviews.value.length : Number(place.value?.reviewCount ?? 0)
));
const averageRating = computed(() => {
  const rated = reviews.value.map((review) => Number(review.rating)).filter((rating) => Number.isFinite(rating));
  if (rated.length) return (rated.reduce((sum, rating) => sum + rating, 0) / rated.length).toFixed(1);
  if (reviewsLoaded.value) return '0.0';
  const fromPlace = Number(place.value?.averageRating ?? 0);
  return fromPlace > 0 ? fromPlace.toFixed(1) : '0.0';
});
const ratingSummary = computed(() => [5, 4, 3, 2, 1].map((score) => {
  const count = reviews.value.filter((review) => Math.round(Number(review.rating)) === score).length;
  return {
    score,
    count,
    percent: reviewCount.value ? Math.round((count / reviewCount.value) * 100) : 0,
  };
}));

function normalizeRating(value) {
  const rating = Number(value);
  if (!Number.isFinite(rating)) return 5;
  return Math.min(5, Math.max(1, Math.round(rating)));
}

function setReviewRating(form, rating) {
  form.rating = normalizeRating(rating);
}

function isReviewOwner(review) {
  return Boolean(uiStore.currentUser?.userId)
    && String(review?.userId ?? '') === String(uiStore.currentUser.userId);
}

function reviewStatsText() {
  return t('place.detail.reviewStats', { count: reviewCount.value, rating: averageRating.value });
}

function reviewActionMessage(error, fallback) {
  const status = error?.response?.status;
  const code = error?.response?.data?.code;
  if (code === 'DUPLICATE_ACTION' || status === 409) {
    return t('place.detail.reviewDuplicateMessage');
  }
  if (code === 'FORBIDDEN' || status === 403) {
    return t('place.detail.reviewForbiddenMessage');
  }
  if (code === 'AUTH_REQUIRED' || status === 401) {
    return t('place.detail.reviewAuthMessage');
  }
  if (code === 'NOT_FOUND' || status === 404) {
    return t('place.detail.reviewNotFoundMessage');
  }
  return getUserMessage(error, fallback);
}

async function loadPlaceDetail() {
  if (!placeId.value) {
    errorMessage.value = t('place.detail.notFoundMessage');
    return;
  }
  loading.value = true;
  errorMessage.value = '';
  place.value = await placeStore.getById(placeId.value);
  if (!place.value) {
    errorMessage.value = placeStore.error || t('place.detail.loadFailedMessage');
    loading.value = false;
    return;
  }
  placeImageFailed.value = false;
  uiStore.markViewedPlace(place.value.placeId, place.value);
  await loadReviews();
  loading.value = false;
}

onMounted(loadPlaceDetail);

async function loadReviews() {
  if (!placeId.value) return;
  reviewLoading.value = true;
  reviewsLoaded.value = false;
  reviewError.value = '';
  reviewNotice.value = null;
  try {
    reviews.value = await fetchPlaceReviews(placeId.value);
    reviewsLoaded.value = true;
  } catch (error) {
    reviewError.value = getUserMessage(error, t('place.detail.reviewLoadFailedMessage'));
    reviews.value = [];
    reviewsLoaded.value = true;
  } finally {
    reviewLoading.value = false;
  }
}

async function submitReview() {
  if (!place.value || reviewSubmitting.value) return;
  if (!uiStore.requireAuth(t('place.detail.reviewLoginRequired'))) return;
  if (!reviewForm.value.content.trim()) {
    reviewError.value = t('place.detail.reviewContentRequired');
    reviewNotice.value = {
      tone: 'warning',
      title: t('profile.edit.validation.title'),
      text: reviewError.value,
    };
    uiStore.notify(reviewError.value);
    return;
  }
  if (ratingOptions.includes(Number(reviewForm.value.rating)) === false) {
    reviewError.value = t('place.detail.ratingRequired');
    reviewNotice.value = {
      tone: 'warning',
      title: t('place.detail.ratingWarningTitle'),
      text: reviewError.value,
    };
    uiStore.notify(reviewError.value);
    return;
  }
  reviewSubmitting.value = true;
  reviewError.value = '';
  reviewNotice.value = {
    tone: 'info',
    title: t('place.detail.reviewSavingTitle'),
    text: t('place.detail.reviewSavingText'),
  };
  try {
    const created = await createPlaceReview(place.value.placeId, {
      rating: normalizeRating(reviewForm.value.rating),
      content: reviewForm.value.content,
    });
    reviews.value = [created, ...reviews.value.filter((review) => review.reviewId !== created.reviewId)];
    reviewForm.value = { rating: 5, content: '' };
    reviewNotice.value = {
      tone: 'success',
      title: t('place.detail.reviewSavedTitle'),
      text: t('place.detail.reviewSavedText', { stats: reviewStatsText() }),
    };
    uiStore.notify(t('place.detail.reviewSavedToast'), 'success');
  } catch (error) {
    reviewError.value = reviewActionMessage(error, t('place.detail.reviewSaveFailedMessage'));
    reviewNotice.value = {
      tone: 'error',
      title: t('place.detail.reviewSaveFailedTitle'),
      text: reviewError.value,
    };
  } finally {
    reviewSubmitting.value = false;
  }
}

function startEditReview(review) {
  editingReviewId.value = review.reviewId;
  editReviewForm.value = {
    rating: normalizeRating(review.rating ?? 5),
    content: review.content ?? '',
  };
  reviewError.value = '';
  reviewNotice.value = {
    tone: 'info',
    title: t('place.detail.myReviewEditTitle'),
    text: t('place.detail.myReviewEditText'),
  };
}

function cancelEditReview() {
  editingReviewId.value = null;
  editReviewForm.value = { rating: 5, content: '' };
}

async function submitReviewEdit(review) {
  if (!place.value || !review?.reviewId || reviewSubmitting.value) return;
  if (!editReviewForm.value.content.trim()) {
    reviewError.value = t('place.detail.reviewContentRequired');
    reviewNotice.value = {
      tone: 'warning',
      title: t('profile.edit.validation.title'),
      text: reviewError.value,
    };
    uiStore.notify(reviewError.value);
    return;
  }
  if (ratingOptions.includes(Number(editReviewForm.value.rating)) === false) {
    reviewError.value = t('place.detail.ratingRequired');
    reviewNotice.value = {
      tone: 'warning',
      title: t('place.detail.ratingWarningTitle'),
      text: reviewError.value,
    };
    uiStore.notify(reviewError.value);
    return;
  }
  reviewSubmitting.value = true;
  reviewError.value = '';
  reviewNotice.value = {
    tone: 'info',
    title: t('place.detail.reviewUpdatingTitle'),
    text: t('place.detail.reviewUpdatingText'),
  };
  try {
    const updated = await updatePlaceReview(place.value.placeId, review.reviewId, {
      rating: normalizeRating(editReviewForm.value.rating),
      content: editReviewForm.value.content,
    });
    reviews.value = reviews.value.map((item) => (item.reviewId === updated.reviewId ? updated : item));
    cancelEditReview();
    reviewNotice.value = {
      tone: 'success',
      title: t('place.detail.reviewUpdatedTitle'),
      text: t('place.detail.reviewUpdatedText', { stats: reviewStatsText() }),
    };
    uiStore.notify(t('place.detail.reviewUpdatedToast'), 'success');
  } catch (error) {
    reviewError.value = reviewActionMessage(error, t('place.detail.reviewUpdateFailedMessage'));
    reviewNotice.value = {
      tone: 'error',
      title: t('place.detail.reviewUpdateFailedTitle'),
      text: reviewError.value,
    };
  } finally {
    reviewSubmitting.value = false;
  }
}

async function removeReview(review) {
  if (!place.value || !review?.reviewId || reviewSubmitting.value) return;
  if (!window.confirm(t('place.detail.reviewDeleteConfirm'))) return;
  reviewSubmitting.value = true;
  reviewError.value = '';
  reviewNotice.value = {
    tone: 'info',
    title: t('place.detail.reviewDeletingTitle'),
    text: t('place.detail.reviewDeletingText'),
  };
  try {
    await deletePlaceReview(place.value.placeId, review.reviewId);
    reviews.value = reviews.value.filter((item) => item.reviewId !== review.reviewId);
    if (editingReviewId.value === review.reviewId) cancelEditReview();
    reviewNotice.value = {
      tone: 'success',
      title: t('place.detail.reviewDeletedTitle'),
      text: t('place.detail.reviewDeletedText', { stats: reviewStatsText() }),
    };
    uiStore.notify(t('place.detail.reviewDeletedToast'), 'success');
  } catch (error) {
    reviewError.value = reviewActionMessage(error, t('place.detail.reviewDeleteFailedMessage'));
    reviewNotice.value = {
      tone: 'error',
      title: t('place.detail.reviewDeleteFailedTitle'),
      text: reviewError.value,
    };
  } finally {
    reviewSubmitting.value = false;
  }
}

function startCourse() {
  const firstContent = relatedContents.value[0];
  uiStore.setAiSelection(firstContent ? [firstContent.contentId] : []);
  router.push('/ai/conditions');
}

function markPlaceImageFailed() {
  placeImageFailed.value = true;
}
</script>

<template>
  <AppLayout :title="t('place.detail.title')" back>
    <template #actions>
      <button
        class="icon-button heart-button"
        :class="{ active: liked }"
        type="button"
        :aria-label="t('content.detail.likeAria')"
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
      :title="t('place.detail.loadingTitle')"
      :text="t('place.detail.loadingText')"
    />
    <DetailNotFoundPanel
      v-else-if="errorMessage"
      :title="t('place.detail.errorTitle')"
      :text="errorMessage"
      :list-label="t('place.detail.backToList')"
      list-to="/places"
      @retry="loadPlaceDetail"
    />
    <section v-else-if="place" class="detail-screen place-detail-screen">
      <div class="detail-hero place">
        <img
          v-if="showPlaceImage"
          :src="placeImageUrl"
          :alt="t('place.detail.imageAlt', { name: displayPlace.placeName })"
          @error="markPlaceImageFailed"
        />
        <div v-else class="detail-hero-placeholder" aria-hidden="true">
          <span>{{ placeInitial }}</span>
        </div>
        <div>
          <h1>{{ displayPlace.placeName }}</h1>
          <p>{{ placeMeta }}</p>
        </div>
      </div>
      <div class="detail-body place-detail-body">
        <p class="place-description-copy">{{ displayPlace.description }}</p>
        <p class="meta-line">{{ displayPlace.address }}</p>
        <MapPreview :route-places="mapRoutePlaces" :show-detail-link="false" />
        <div class="action-grid two">
          <BaseButton
            :variant="uiStore.plannedVisits.includes(place.placeId) ? 'primary' : 'secondary'"
            :disabled="visitPending"
            @click="uiStore.setVisit(place.placeId, 'planned')"
          >
            {{ t('place.detail.plannedVisit') }}
          </BaseButton>
          <BaseButton
            :variant="uiStore.completedVisits.includes(place.placeId) ? 'primary' : 'secondary'"
            :disabled="visitPending"
            @click="uiStore.setVisit(place.placeId, 'completed')"
          >
            {{ t('place.detail.completedVisit') }}
          </BaseButton>
        </div>
      </div>

      <ReviewPanel :title="t('place.detail.visitReviews')" :review-count="reviewCount" :average-rating="averageRating">
        <template #summary>
          <div class="review-summary-panel" :aria-label="t('place.detail.reviewSummaryAria')">
            <strong>★ {{ averageRating }}</strong>
            <span>{{ t('place.detail.reviewCount', { count: reviewCount }) }}</span>
            <small>{{ t('place.detail.reviewSummaryText') }}</small>
            <div v-if="reviews.length" class="rating-distribution" :aria-label="t('place.detail.ratingDistributionAria')">
              <span v-for="item in ratingSummary" :key="item.score">
                <b>{{ t('place.detail.ratingPoint', { score: item.score }) }}</b>
                <i><em :style="{ width: `${item.percent}%` }"></em></i>
                <small>{{ item.count }}</small>
              </span>
            </div>
          </div>
        </template>
        <template #status>
          <FormStatusNotice
            v-if="reviewNotice"
            :tone="reviewNotice.tone"
            :title="reviewNotice.title"
            :text="reviewNotice.text"
          />
        </template>
        <template #states>
          <EmptyState
            v-if="reviewLoading"
            tone="loading"
            compact
            :title="t('place.detail.reviewLoadingTitle')"
            :text="t('place.detail.reviewLoadingText')"
          />
          <EmptyState
            v-else-if="reviewError && !reviews.length"
            icon="!"
            tone="error"
            compact
            :title="t('place.detail.reviewLoadFailedTitle')"
            :text="reviewError"
            :action-label="t('common.retry')"
            @action="loadReviews"
          />
        </template>
        <template #list>
          <div v-if="!reviewLoading && !(reviewError && !reviews.length)" class="review-list">
            <article v-for="review in reviews" :key="review.reviewId" class="review-row">
              <div class="review-row-head">
                <strong>{{ review.nickname }}</strong>
                <span class="review-rating-value">★ {{ normalizeRating(review.rating) }}</span>
              </div>
              <template v-if="editingReviewId === review.reviewId">
                <div class="form-field compact star-rating-field">
  <span>{{ t('reviews.rating') }}</span>
  <div class="star-rating" role="radiogroup" :aria-label="t('place.detail.editRatingAria')">
    <button
      v-for="score in ratingOptions"
      :key="`edit-rating-${score}`"
      type="button"
      class="star-rating-button"
      :class="{ selected: score <= normalizeRating(editReviewForm.rating) }"
      :aria-pressed="score === normalizeRating(editReviewForm.rating)"
      @click="setReviewRating(editReviewForm, score)"
    >
      ★
    </button>
  </div>
  <small class="star-rating-text">{{ t('place.detail.ratingPoint', { score: normalizeRating(editReviewForm.rating) }) }}</small>
</div>
                <label class="form-field compact">
                  {{ t('reviews.title') }}
                  <textarea
                    v-model="editReviewForm.content"
                    maxlength="500"
                    :placeholder="t('place.detail.reviewPlaceholder')"
                  ></textarea>
                </label>
                <div class="review-row-actions">
                  <button
                    type="button"
                    :disabled="reviewSubmitting || !editReviewForm.content.trim()"
                    @click="submitReviewEdit(review)"
                  >
                    {{ t('common.save') }}
                  </button>
                  <button type="button" :disabled="reviewSubmitting" @click="cancelEditReview">{{ t('common.cancel') }}</button>
                </div>
              </template>
              <template v-else>
                <TranslatableText :text="review.content" :source-language="review.language" resource-type="REVIEW" :resource-id="review.reviewId" field="content" />
                <div v-if="isReviewOwner(review)" class="review-row-actions">
                  <button type="button" @click="startEditReview(review)">{{ t('common.edit') }}</button>
                  <button type="button" @click="removeReview(review)">{{ t('common.delete') }}</button>
                </div>
              </template>
            </article>
            <EmptyState
              v-if="!reviews.length"
              icon="R"
              tone="search"
              compact
              :title="t('reviews.emptyTitle')"
              :text="t('reviews.emptyText')"
            />
          </div>
        </template>
        <template #form>
          <form v-if="uiStore.currentUser && !hasMyReview" class="review-form" @submit.prevent="submitReview">
            <div class="form-field star-rating-field">
  <span>{{ t('reviews.rating') }}</span>
  <div class="star-rating" role="radiogroup" :aria-label="t('place.detail.newRatingAria')">
    <button
      v-for="score in ratingOptions"
      :key="`new-rating-${score}`"
      type="button"
      class="star-rating-button"
      :class="{ selected: score <= normalizeRating(reviewForm.rating) }"
      :aria-pressed="score === normalizeRating(reviewForm.rating)"
      @click="setReviewRating(reviewForm, score)"
    >
      ★
    </button>
  </div>
  <small class="star-rating-text">{{ t('place.detail.ratingPoint', { score: normalizeRating(reviewForm.rating) }) }}</small>
</div>
            <label class="form-field">
              {{ t('reviews.title') }}
              <textarea v-model="reviewForm.content" maxlength="500" :placeholder="t('place.detail.reviewWritePlaceholder')"></textarea>
            </label>
            <p v-if="reviewError" class="form-error">{{ reviewError }}</p>
            <BaseButton block :disabled="reviewSubmitting || !reviewForm.content.trim()">
              {{ reviewSubmitting ? t('place.detail.reviewSubmitting') : t('reviews.submit') }}
            </BaseButton>
          </form>
          <FormStatusNotice
            v-else-if="uiStore.currentUser"
            class="review-duplicate-notice"
            tone="info"
            compact
            :title="t('place.detail.alreadyReviewedTitle')"
            :text="myReview ? t('place.detail.alreadyReviewedWithMineText') : t('place.detail.alreadyReviewedText')"
          />
          <EmptyState
            v-else
            icon="K"
            tone="login"
            compact
            :title="t('place.detail.reviewLoginTitle')"
            :text="t('place.detail.reviewLoginText')"
            :action-label="t('auth.login.title')"
            action-to="/login"
          />
        </template>
      </ReviewPanel>

      <div class="section-header"><h2>{{ t('place.detail.relatedContents') }}</h2></div>
      <EmptyState
        v-if="!relatedContents.length"
        compact
        :title="t('place.detail.relatedEmptyTitle')"
        :text="t('place.detail.relatedEmptyText')"
      />
      <div v-else class="chip-row wrap">
        <RouterLink v-for="content in localizedRelatedContents" :key="content.contentId" class="chip" :to="'/contents/' + content.contentId">
          {{ content.title }}
        </RouterLink>
      </div>
      <div class="sticky-actions">
        <BaseButton block @click="startCourse">{{ t('place.detail.createCourseFromPlace') }}</BaseButton>
      </div>
    </section>
  </AppLayout>
</template>
