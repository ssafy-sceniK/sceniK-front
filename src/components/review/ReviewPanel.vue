<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
defineOptions({
  name: 'ReviewPanel',
});

const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  averageRating: {
    type: [String, Number],
    default: '0.0',
  },
});

const displayTitle = computed(() => props.title || t('place.detail.visitReviews'));
</script>

<template>
  <section class="review-panel" aria-labelledby="review-panel-title">
    <div class="section-header">
      <h2 id="review-panel-title">{{ displayTitle }}</h2>
      <span>
        {{ t('reviews.cleanup.k5f145dcdd7', { count: props.reviewCount }) }}
        <span v-if="props.reviewCount"> · {{ t('reviews.cleanup.k11e333b564', { count: props.averageRating }) }}</span>
      </span>
    </div>
    <slot name="summary"></slot>
    <slot name="status"></slot>
    <slot name="states"></slot>
    <slot name="list"></slot>
    <slot name="form"></slot>
  </section>
</template>
