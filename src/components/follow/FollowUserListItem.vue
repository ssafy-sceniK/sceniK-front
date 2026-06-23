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
    <RouterLink class="follow-user-link" :to="`/users/${props.user.userId}`">
      <span class="user-list-avatar">{{ props.initial }}</span>
      <span>
        <strong>
          {{ props.user.nickname }}
        </strong>
        <small>팔로워 {{ props.user.followerCount ?? 0 }} · 팔로잉 {{ props.user.followingCount ?? 0 }}</small>
      </span>
    </RouterLink>
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