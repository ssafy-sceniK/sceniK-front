<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
defineOptions({
  name: 'AiPromptContextSummary',
});

const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  rows: {
    type: Array,
    default: () => [],
  },
  compact: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <section class="ai-context-panel ai-prompt-context-summary" :class="{ compact: props.compact }" aria-label="AI prompt context summary">
    <strong>{{ props.title || t('aiCourse.cleanup.k7817a349e1') }}</strong>
    <dl>
      <template v-for="row in props.rows" :key="row.label">
        <dt>{{ row.label }}</dt>
        <dd>{{ row.value }}</dd>
      </template>
    </dl>
  </section>
</template>
