<script setup>
import { useI18n } from 'vue-i18n';
import EmptyState from '../common/EmptyState.vue';

const { t } = useI18n();

defineOptions({
  name: 'DetailNotFoundPanel',
});

const props = defineProps({
  title: {
    type: String,
    default: '\uc0c1\uc138 \uc815\ubcf4\ub97c \ucc3e\uc744 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4',
  },
  text: {
    type: String,
    default: '\uc694\uccad\ud55c \ud56d\ubaa9\uc774 \uc5c6\uac70\ub098 \ub354 \uc774\uc0c1 \uc81c\uacf5\ub418\uc9c0 \uc54a\uc2b5\ub2c8\ub2e4.',
  },
  retryLabel: {
    type: String,
    default: '\ub2e4\uc2dc \uc2dc\ub3c4',
  },
  listLabel: {
    type: String,
    default: '\ubaa9\ub85d\uc73c\ub85c \ub3cc\uc544\uac00\uae30',
  },
  listTo: {
    type: String,
    default: '/home',
  },
});

const emit = defineEmits(['retry']);
</script>

<template>
  <section class="detail-not-found-panel" :aria-label="t('common.cleanup.k08b0e222b3')">
    <EmptyState
      icon="!"
      tone="error"
      :title="props.title"
      :text="props.text"
      :action-label="props.retryLabel"
      :secondary-label="props.listLabel"
      :secondary-to="props.listTo"
      @action="emit('retry')"
    />
  </section>
</template>
