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
      {{ props.loading ? t('profile.cleanup.k8015095ff4') : props.following ? t('profile.cleanup.k615cf6ee33') : t('profile.cleanup.k5b35787117') }}
    </button>
  </div>
</template>
