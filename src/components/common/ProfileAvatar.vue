<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const props = defineProps({
  imageUrl: { type: String, default: '' },
  initial: { type: String, default: 'K' },
  alt: { type: String, default: '\ud504\ub85c\ud544 \uc774\ubbf8\uc9c0' },
  interactive: { type: Boolean, default: false },
  ariaLabel: { type: String, default: '\ud504\ub85c\ud544 \ud3b8\uc9d1' },
  preview: { type: Boolean, default: false },
  badgeLabel: { type: String, default: '\u270E' },
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
    <span class="avatar-image-frame">
      <img v-if="imageUrl" :src="imageUrl" :alt="alt" />
      <span v-else class="avatar-initial">{{ initial }}</span>
    </span>
    <span v-if="interactive" class="avatar-edit-badge large">{{ badgeLabel }}</span>
  </component>
</template>
