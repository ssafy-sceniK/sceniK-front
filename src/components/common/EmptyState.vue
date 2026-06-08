<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: { type: String, required: true },
  text: { type: String, default: '' },
  icon: { type: String, default: '' },
  tone: { type: String, default: 'neutral' },
  compact: { type: Boolean, default: false },
  actionLabel: { type: String, default: '' },
  actionTo: { type: [String, Object], default: '' },
  secondaryLabel: { type: String, default: '' },
  secondaryTo: { type: [String, Object], default: '' },
});

defineEmits(['action', 'secondary']);

const iconLabel = computed(() => {
  if (props.icon) return props.icon;
  const map = {
    route: 'AI',
    community: 'C',
    notification: '!',
    search: '?',
    error: '!',
    loading: '',
    login: 'K',
  };
  return map[props.tone] ?? 'SK';
});
</script>

<template>
  <div class="empty-state" :class="[`empty-state--${tone}`, { 'empty-state--compact': compact }]">
    <div class="empty-state__visual" aria-hidden="true">
      <span v-if="iconLabel">{{ iconLabel }}</span>
    </div>

    <div class="empty-state__copy">
      <strong>{{ title }}</strong>
      <p v-if="text">{{ text }}</p>
    </div>

    <div v-if="actionLabel || secondaryLabel" class="empty-state__actions">
      <RouterLink
        v-if="actionLabel && actionTo"
        class="button button-primary"
        :to="actionTo"
      >
        {{ actionLabel }}
      </RouterLink>
      <button
        v-else-if="actionLabel"
        type="button"
        class="button button-primary"
        @click="$emit('action')"
      >
        {{ actionLabel }}
      </button>

      <RouterLink
        v-if="secondaryLabel && secondaryTo"
        class="button button-secondary"
        :to="secondaryTo"
      >
        {{ secondaryLabel }}
      </RouterLink>
      <button
        v-else-if="secondaryLabel"
        type="button"
        class="button button-secondary"
        @click="$emit('secondary')"
      >
        {{ secondaryLabel }}
      </button>
    </div>
  </div>
</template>
