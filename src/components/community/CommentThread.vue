<script setup>
defineOptions({
  name: 'CommentThread',
});

const props = defineProps({
  count: {
    type: Number,
    default: 0,
  },
});
</script>

<template>
  <section id="community-comments" class="comments-panel comment-thread-panel" aria-labelledby="comment-thread-title">
    <h2 id="comment-thread-title">댓글 {{ props.count }}</h2>
    <slot></slot>
  </section>
</template>
