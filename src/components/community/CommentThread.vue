<script setup>
import { useI18n } from 'vue-i18n';
defineOptions({
  name: 'CommentThread',
});

const props = defineProps({
  count: {
    type: Number,
    default: 0,
  },
});

const { t } = useI18n();
</script>

<template>
  <section id="community-comments" class="comments-panel comment-thread-panel" tabindex="-1" aria-labelledby="comment-thread-title">
    <h2 id="comment-thread-title">{{ t('community.comments.titleWithCount', { count: props.count }) }}</h2>
    <slot></slot>
  </section>
</template>
