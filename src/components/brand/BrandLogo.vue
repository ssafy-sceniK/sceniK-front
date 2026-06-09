<script setup>
import scenikLogoBlue from '../../assets/brand/scenik_single_wordmark_blue.png';

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
    class="scenik-logo"
    :class="`scenik-logo--${props.size}`"
  >
    <img class="scenik-logo__image" :src="scenikLogoBlue" alt="sceniK" />
  </span>
</template>
