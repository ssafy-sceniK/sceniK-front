<script setup>
const props = defineProps({
  imageUrl: { type: String, default: '' },
  initial: { type: String, default: 'K' },
  alt: { type: String, default: '프로필 이미지' },
  interactive: { type: Boolean, default: false },
  ariaLabel: { type: String, default: '프로필 편집' },
  preview: { type: Boolean, default: false },
  badgeLabel: { type: String, default: '✎' },
});

const emit = defineEmits(['click']);

function handleClick(event) {
  if (props.interactive) emit('click', event);
}
</script>

<template>
  <component
    :is="interactive ? 'button' : 'div'"
    class="avatar large profile-photo-avatar"
    :class="{
      'profile-avatar-button': interactive,
      'profile-preview-avatar': preview,
    }"
    :type="interactive ? 'button' : undefined"
    :aria-label="interactive ? ariaLabel : undefined"
    @click="handleClick"
  >
    <img v-if="imageUrl" :src="imageUrl" :alt="alt" />
    <span v-else>{{ initial }}</span>
    <span class="avatar-edit-badge large">{{ badgeLabel }}</span>
  </component>
</template>
