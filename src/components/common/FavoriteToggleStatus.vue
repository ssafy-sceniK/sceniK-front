<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
defineOptions({
  name: 'FavoriteToggleStatus',
});

const props = defineProps({
  active: {
    type: Boolean,
    default: false,
  },
  pending: {
    type: Boolean,
    default: false,
  },
  activeText: {
    type: String,
    default: '\uc88b\uc544\uc694 \uc644\ub8cc',
  },
  inactiveText: {
    type: String,
    default: '\uc88b\uc544\uc694 \ucde8\uc18c\ub428',
  },
  pendingText: {
    type: String,
    default: '\uc0c1\ud0dc\ub97c \uc800\uc7a5\ud558\ub294 \uc911\uc785\ub2c8\ub2e4',
  },
});
</script>

<template>
  <p class="favorite-toggle-status" aria-live="polite">
    {{ props.pending ? props.pendingText : props.active ? props.activeText : props.inactiveText }}
  </p>
</template>

<style scoped>
.favorite-toggle-status {
  margin: 8px 0 0;
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 800;
}
</style>
