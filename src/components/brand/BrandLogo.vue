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
    :style="{ '--scenik-logo-mask': `url(${scenikLogoBlue})` }"
  >
    <img class="scenik-logo__image" :src="scenikLogoBlue" alt="sceniK" />
    <span class="scenik-logo__dark-mark" aria-hidden="true"></span>
  </span>
</template>
