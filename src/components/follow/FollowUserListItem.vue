<script setup>
import { useI18n } from 'vue-i18n';
import AuthorAvatar from '../common/AuthorAvatar.vue';

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
    default: '',
  },
});

const emit = defineEmits(['toggle']);
const { t } = useI18n();
</script>

<template>
  <article class="user-list-row follow-user-list-item">
    <RouterLink class="follow-user-link" :to="'/users/' + props.user.userId">
      <AuthorAvatar
        class="user-list-avatar"
        :image-url="props.user.profileImageUrl || props.user.profile_image_url || ''"
        alt=""
      />
      <span>
        <strong>
          {{ props.user.nickname }}
        </strong>
        <small>
          {{ t('my.activity.follow.followersCount', { count: props.user.followerCount ?? 0 }) }} /
          {{ t('my.activity.follow.followingCount', { count: props.user.followingCount ?? 0 }) }}
        </small>
      </span>
    </RouterLink>
    <button
      v-if="String(props.user.userId) !== String(props.currentUserId)"
      type="button"
      :disabled="props.pending"
      @click="emit('toggle', props.user)"
    >
      {{ props.buttonLabel || t('my.activity.follow.follow') }}
    </button>
  </article>
</template>
