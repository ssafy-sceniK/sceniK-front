<script setup>
import { useI18n } from 'vue-i18n';
import FormStatusNotice from '../common/FormStatusNotice.vue';

const { t } = useI18n();

defineOptions({
  name: 'SignupValidationPanel',
});

const props = defineProps({
  fieldErrors: {
    type: Array,
    default: () => [],
  },
  error: {
    type: String,
    default: '',
  },
  success: {
    type: String,
    default: '',
  },
});
</script>

<template>
  <section
    v-if="props.fieldErrors.length || props.error || props.success"
    class="signup-validation-panel"
    :aria-label="t('auth.cleanup.k51ac4349eb')"
  >
    <ul v-if="props.fieldErrors.length" class="signup-field-error-list" :aria-label="t('auth.cleanup.k3754f6d005')">
      <li v-for="fieldError in props.fieldErrors" :key="`${fieldError.field}-${fieldError.message}`">
        <b v-if="fieldError.field">{{ fieldError.field }}</b>
        <span>{{ fieldError.message }}</span>
      </li>
    </ul>
    <FormStatusNotice v-if="props.error" tone="error" :title="t('auth.cleanup.k168c4b1d36')" :text="props.error" />
    <FormStatusNotice v-if="props.success" tone="success" :title="t('auth.cleanup.kdf98e5ff6f')" :text="props.success" />
  </section>
</template>

<style scoped>
.signup-validation-panel {
  display: grid;
  gap: 10px;
}

.signup-field-error-list {
  margin: -2px 0 0;
  padding: 10px 12px;
  display: grid;
  gap: 6px;
  color: var(--color-semantic-down);
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.16);
  border-radius: var(--radius-md);
  list-style: none;
  font-size: 12px;
  line-height: 1.45;
}

.signup-field-error-list li {
  display: flex;
  gap: 6px;
}

.signup-field-error-list b {
  flex: 0 0 auto;
}
</style>
