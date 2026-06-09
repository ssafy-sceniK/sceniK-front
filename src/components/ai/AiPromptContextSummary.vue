<script setup>
defineOptions({
  name: 'AiPromptContextSummary',
});

const props = defineProps({
  title: {
    type: String,
    default: 'AI가 참고하는 조건',
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
    <strong>{{ props.title }}</strong>
    <dl>
      <template v-for="row in props.rows" :key="row.label">
        <dt>{{ row.label }}</dt>
        <dd>{{ row.value }}</dd>
      </template>
    </dl>
  </section>
</template>
