<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: { type: String, required: true },
  text: { type: String, default: '' },
  description: { type: String, default: '' },
  icon: { type: String, default: '' },
  tone: { type: String, default: 'neutral' },
  compact: { type: Boolean, default: false },
  variant: { type: String, default: 'card' },
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

const bodyText = computed(() => props.description || props.text);
</script>

<template>
  <div
    class="empty-state"
    :class="[
      `empty-state--${tone}`,
      `empty-state--${variant}`,
      { 'empty-state--compact': compact },
    ]"
  >
    <div class="empty-state__visual" aria-hidden="true">
      <span v-if="iconLabel">{{ iconLabel }}</span>
    </div>

    <div class="empty-state__copy">
      <strong>{{ title }}</strong>
      <p v-if="bodyText">{{ bodyText }}</p>
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

<style scoped>
.empty-state {
  --empty-accent: var(--color-primary);
  --empty-accent-soft: rgba(0, 82, 255, 0.08);
  --empty-accent-border: rgba(0, 82, 255, 0.16);
  position: relative;
  min-width: 0;
  min-height: 128px;
  padding: 18px 16px;
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 10px;
  overflow: hidden;
  color: var(--text);
  text-align: center;
  background: linear-gradient(180deg, #ffffff 0%, rgba(247, 247, 247, 0.96) 100%);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.04);
}

.empty-state::before,
.empty-state::after,
.empty-state__visual::before {
  display: none;
}

.empty-state--route,
.empty-state--search,
.empty-state--login {
  --empty-accent: var(--color-primary);
  --empty-accent-soft: rgba(0, 82, 255, 0.08);
  --empty-accent-border: rgba(0, 82, 255, 0.16);
}

.empty-state--community {
  --empty-accent: var(--color-teal-deep);
  --empty-accent-soft: rgba(0, 82, 255, 0.07);
  --empty-accent-border: rgba(0, 82, 255, 0.14);
}

.empty-state--notification {
  --empty-accent: var(--color-accent-yellow);
  --empty-accent-soft: rgba(244, 176, 0, 0.1);
  --empty-accent-border: rgba(244, 176, 0, 0.18);
}

.empty-state--error {
  --empty-accent: var(--color-semantic-down);
  --empty-accent-soft: rgba(207, 32, 47, 0.08);
  --empty-accent-border: rgba(207, 32, 47, 0.16);
}

.empty-state--compact {
  min-height: 112px;
  padding: 16px 14px;
  gap: 8px;
}

.empty-state--inline {
  min-height: auto;
  padding: 14px;
  background: var(--color-surface-soft);
  box-shadow: none;
}

.empty-state__visual {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  color: var(--empty-accent);
  background: var(--empty-accent-soft);
  border: 1px solid var(--empty-accent-border);
  border-radius: var(--radius-full);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.72);
  font-size: 11px;
  font-weight: 900;
  line-height: 1;
}

.empty-state--compact .empty-state__visual {
  width: 34px;
  height: 34px;
  font-size: 10px;
}

.empty-state--loading .empty-state__visual {
  border-color: transparent;
  background:
    conic-gradient(var(--empty-accent) 0 96deg, transparent 97deg 360deg),
    #ffffff;
  animation: empty-state-spin 900ms linear infinite;
}

.empty-state--loading .empty-state__visual span {
  color: transparent;
}

.empty-state__copy {
  display: grid;
  gap: 5px;
  min-width: 0;
}

.empty-state strong {
  color: var(--text);
  font-size: 15px;
  font-weight: 800;
  line-height: 1.35;
  letter-spacing: 0;
}

.empty-state p {
  max-width: 296px;
  margin: 0 auto;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.55;
}

.empty-state__actions {
  width: 100%;
  max-width: 276px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 2px;
}

.empty-state__actions .button {
  width: auto;
  min-width: 0;
  min-height: 34px;
  padding: 0 13px;
  border-radius: var(--radius-pill);
  font-size: 12px;
  font-weight: 800;
  white-space: normal;
}

.empty-state__actions .button-primary {
  box-shadow: 0 6px 14px rgba(0, 82, 255, 0.12);
}

.empty-state__actions .button:focus-visible {
  outline: 2px solid rgba(0, 82, 255, 0.32);
  outline-offset: 2px;
}

:global(.comments-panel) .empty-state {
  min-height: auto;
  padding: 14px 0;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

:global(.comments-panel) .empty-state__visual {
  display: none;
}

:global(.course-recommend-panel) .empty-state {
  min-height: auto;
  background: var(--color-surface-soft);
  box-shadow: none;
}

@keyframes empty-state-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 380px) {
  .empty-state {
    padding-inline: 13px;
  }

  .empty-state p {
    max-width: 248px;
  }

  .empty-state__actions {
    max-width: 100%;
  }
}
</style>
