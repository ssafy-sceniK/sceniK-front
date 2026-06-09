<script setup>
defineOptions({
  name: 'ReviewPanel',
});

const props = defineProps({
  title: {
    type: String,
    default: '방문 리뷰',
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
</script>

<template>
  <section class="review-panel" aria-labelledby="review-panel-title">
    <div class="section-header">
      <h2 id="review-panel-title">{{ props.title }}</h2>
      <span>
        {{ props.reviewCount }}개
        <span v-if="props.reviewCount"> · 평균 ★ {{ props.averageRating }}</span>
      </span>
    </div>
    <slot name="summary"></slot>
    <slot name="status"></slot>
    <slot name="states"></slot>
    <slot name="list"></slot>
    <slot name="form"></slot>
  </section>
</template>
