<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  readonly: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue', 'focus']);
const { t } = useI18n();
const displayPlaceholder = computed(() => props.placeholder || t('common.searchPlaceholder'));
</script>

<template>
  <label class="search-bar">
    <input
      :value="props.modelValue"
      :placeholder="displayPlaceholder"
      :readonly="props.readonly"
      @input="emit('update:modelValue', $event.target.value)"
      @focus="emit('focus')"
    />
    <svg class="search-bar-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M10.75 4.5a6.25 6.25 0 1 0 0 12.5 6.25 6.25 0 0 0 0-12.5Zm-8 6.25a8 8 0 1 1 14.22 5.02l3.63 3.63a.88.88 0 0 1-1.24 1.24l-3.63-3.63A8 8 0 0 1 2.75 10.75Z"
        fill="currentColor"
      />
    </svg>
  </label>
</template>
