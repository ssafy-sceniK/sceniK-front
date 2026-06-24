<script setup>
import { useI18n } from 'vue-i18n';
defineOptions({
  name: 'CommunityPostDetailPanel',
});

const { t } = useI18n();
</script>

<template>
  <section class="community-post-detail-panel" :aria-label="t('community.a11y.postDetailPanel')">
    <slot></slot>
  </section>
</template>
