<script setup>
defineProps({
  variant: { type: String, default: 'primary' },
  block: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
});
</script>

<template>
  <button class="button" :class="[`button-${variant}`, { block }]" :disabled="disabled">
    <slot />
  </button>
</template>
