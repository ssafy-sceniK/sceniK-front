<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
defineOptions({
  name: 'AuthorFollowCard',
});

const props = defineProps({
  authorName: {
    type: String,
    default: '\uc791\uc131\uc790',
  },
  authorInitial: {
    type: String,
    default: '',
  },
  authorTo: {
    type: [String, Object],
    default: '',
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
    <RouterLink v-if="props.authorTo" class="author-profile-link" :to="props.authorTo">
      <span class="comment-avatar author-profile-avatar" aria-hidden="true">{{ props.authorInitial || props.authorName.slice(0, 1).toUpperCase() }}</span>
      <span class="author-profile-copy">
        <b>{{ props.authorName }}</b>
        <span>{{ props.meta }}</span>
      </span>
    </RouterLink>
    <div v-else class="author-profile-link author-profile-link--static">
      <span class="comment-avatar author-profile-avatar" aria-hidden="true">{{ props.authorInitial || props.authorName.slice(0, 1).toUpperCase() }}</span>
      <span class="author-profile-copy">
        <b>{{ props.authorName }}</b>
        <span>{{ props.meta }}</span>
      </span>
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
      {{ props.loading ? t('communityAuto2.k1o') : props.following ? t('communityAuto2.k1p') : t('communityAuto2.k1q') }}
    </button>
  </div>
</template>
