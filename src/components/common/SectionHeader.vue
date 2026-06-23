<script setup>
import { useI18n } from 'vue-i18n';

defineProps({
  title: { type: String, required: true },
  to: { type: String, default: '' },
  actionLabel: { type: String, default: '' },
});

const { t } = useI18n();
</script>

<template>
  <div class="section-header">
    <h2>{{ title }}</h2>
    <RouterLink v-if="to" :to="to">{{ actionLabel || t('common.viewAll') }}</RouterLink>
  </div>
</template>
