<script setup>
defineOptions({
  name: 'FormStatusNotice',
});

const props = defineProps({
  tone: {
    type: String,
    default: 'info',
  },
  title: {
    type: String,
    default: '',
  },
  text: {
    type: String,
    default: '',
  },
  compact: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <div
    class="form-status-notice"
    :class="[`form-status-notice--${props.tone}`, { 'form-status-notice--compact': props.compact }]"
    :role="props.tone === 'error' ? 'alert' : 'status'"
    aria-live="polite"
  >
    <span class="form-status-notice__dot" aria-hidden="true"></span>
    <div>
      <strong v-if="props.title">{{ props.title }}</strong>
      <p v-if="props.text">{{ props.text }}</p>
    </div>
  </div>
</template>

<style scoped>
.form-status-notice {
  --notice-color: var(--color-primary);
  --notice-bg: rgba(0, 82, 255, 0.07);
  --notice-border: rgba(0, 82, 255, 0.16);
  padding: 12px;
  display: grid;
  grid-template-columns: 10px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
  color: var(--text);
  background: var(--notice-bg);
  border: 1px solid var(--notice-border);
  border-radius: var(--radius-lg);
}

.form-status-notice--compact {
  padding: 9px 10px;
  grid-template-columns: 8px minmax(0, 1fr);
}

.form-status-notice--success {
  --notice-color: var(--color-semantic-up);
  --notice-bg: rgba(5, 177, 105, 0.08);
  --notice-border: rgba(5, 177, 105, 0.18);
}

.form-status-notice--error {
  --notice-color: var(--color-semantic-down);
  --notice-bg: rgba(207, 32, 47, 0.07);
  --notice-border: rgba(207, 32, 47, 0.18);
}

.form-status-notice--warning {
  --notice-color: var(--color-accent-yellow);
  --notice-bg: rgba(244, 176, 0, 0.09);
  --notice-border: rgba(244, 176, 0, 0.2);
}

.form-status-notice__dot {
  width: 8px;
  height: 8px;
  margin-top: 5px;
  display: block;
  border-radius: var(--radius-full);
  background: var(--notice-color);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--notice-color) 12%, transparent);
}

.form-status-notice strong {
  display: block;
  color: var(--text);
  font-size: 13px;
  font-weight: 850;
  line-height: 1.35;
}

.form-status-notice p {
  margin: 2px 0 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.45;
}
</style>
