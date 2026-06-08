<script setup>
const props = defineProps({
  size: {
    type: String,
    default: 'nav',
    validator: (value) => ['nav', 'splash'].includes(value),
  },
});
</script>

<template>
  <span
    class="scenik-logo scenik-logo--text"
    :class="[`scenik-logo--${props.size}`, 'scenik-logo--font-dit-magi']"
    aria-label="sceniK"
    role="img"
  >
    <span class="scenik-logo__sceni" aria-hidden="true">sceni</span><span class="scenik-logo__k" aria-hidden="true">K</span>
  </span>
</template>
