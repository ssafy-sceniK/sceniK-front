<script setup>
defineOptions({
  name: 'FollowUserListItem',
});

const props = defineProps({
  user: {
    type: Object,
    required: true,
  },
  initial: {
    type: String,
    default: 'U',
  },
  mutual: {
    type: Boolean,
    default: false,
  },
  currentUserId: {
    type: [String, Number],
    default: '',
  },
  pending: {
    type: Boolean,
    default: false,
  },
  buttonLabel: {
    type: String,
    default: '팔로우',
  },
});

const emit = defineEmits(['toggle']);
</script>

<template>
  <article class="user-list-row follow-user-list-item">
    <span class="user-list-avatar">{{ props.initial }}</span>
    <div>
      <strong>
        {{ props.user.nickname }}
        <em v-if="props.mutual" class="mutual-follow-badge">맞팔</em>
      </strong>
      <small>팔로워 {{ props.user.followerCount }} · 팔로잉 {{ props.user.followingCount }}</small>
    </div>
    <button
      v-if="String(props.user.userId) !== String(props.currentUserId)"
      type="button"
      :disabled="props.pending"
      @click="emit('toggle', props.user)"
    >
      {{ props.buttonLabel }}
    </button>
  </article>
</template>
