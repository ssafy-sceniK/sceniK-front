<script setup>
defineOptions({
  name: 'DefaultAvatarIcon',
});
</script>

<template>
  <svg class="default-avatar-icon" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <circle cx="24" cy="17" r="8" fill="currentColor" opacity="0.96" />
    <path
      d="M10.5 39.5c2.5-8.1 7.4-12.2 13.5-12.2s11 4.1 13.5 12.2"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-width="5"
    />
  </svg>
</template>

<style scoped>
.default-avatar-icon {
  width: 64%;
  height: 64%;
  display: block;
  color: currentColor;
}
</style>
