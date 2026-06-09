<script setup>
defineOptions({
  name: 'AuthorFollowCard',
});

const props = defineProps({
  authorName: {
    type: String,
    default: '작성자',
  },
  meta: {
    type: String,
    default: '',
  },
  canFollow: {
    type: Boolean,
    default: false,
  },
  following: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['toggle']);
</script>

<template>
  <div class="user-row author-follow-card">
    <div>
      <b>{{ props.authorName }}</b>
      <span>{{ props.meta }}</span>
    </div>
    <button
      v-if="props.canFollow"
      type="button"
      class="author-follow-button"
      :class="{ 'is-following': props.following }"
      :aria-pressed="props.following"
      :disabled="props.loading"
      @click="emit('toggle')"
    >
      {{ props.loading ? '처리 중' : props.following ? '팔로잉' : '팔로우' }}
    </button>
  </div>
</template>
