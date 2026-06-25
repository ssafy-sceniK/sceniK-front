<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { languageOptions, normalizeLocale, setLocale } from '../../i18n/index.js';

const props = defineProps({
  variant: {
    type: String,
    default: 'settings',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  ariaLabel: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['change']);
const { t, locale } = useI18n();

const activeLanguage = computed(() => normalizeLocale(locale.value) || 'ko');
const selectorClass = computed(() => `app-language-selector--${props.variant}`);
const isSplashSelector = computed(() => props.variant === 'splash');
const root = ref(null);
const menuOpen = ref(false);
const menuId = computed(() => `app-language-selector-menu-${props.variant}`);

function closeMenu() {
  menuOpen.value = false;
}

function toggleMenu() {
  if (props.disabled) {
    return;
  }

  menuOpen.value = !menuOpen.value;
}

function handleDocumentPointerDown(event) {
  if (!menuOpen.value || root.value?.contains(event.target)) {
    return;
  }

  closeMenu();
}

function handleDocumentKeydown(event) {
  if (event.key === 'Escape') {
    closeMenu();
  }
}

watch(menuOpen, (opened) => {
  if (typeof document === 'undefined') {
    return;
  }

  const method = opened ? 'addEventListener' : 'removeEventListener';
  document[method]('pointerdown', handleDocumentPointerDown);
  document[method]('keydown', handleDocumentKeydown);
});

onBeforeUnmount(() => {
  if (typeof document === 'undefined') {
    return;
  }

  document.removeEventListener('pointerdown', handleDocumentPointerDown);
  document.removeEventListener('keydown', handleDocumentKeydown);
});

function selectLanguage(language) {
  if (props.disabled) {
    return;
  }

  const normalized = setLocale(language);
  emit('change', normalized);
  closeMenu();
}
</script>

<template>
  <div ref="root" class="app-language-selector" :class="selectorClass" role="group" :aria-label="ariaLabel || t('language.selectorTitle')">
    <template v-if="isSplashSelector">
      <button
        type="button"
        class="app-language-selector__trigger"
        :disabled="disabled"
        :aria-label="t('language.selectAria')"
        aria-haspopup="menu"
        :aria-expanded="menuOpen"
        :aria-controls="menuId"
        @click="toggleMenu"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9"></circle>
          <path d="M3 12h18"></path>
          <path d="M12 3c2.4 2.5 3.6 5.5 3.6 9S14.4 18.5 12 21"></path>
          <path d="M12 3C9.6 5.5 8.4 8.5 8.4 12S9.6 18.5 12 21"></path>
        </svg>
      </button>
      <div
        v-if="menuOpen"
        :id="menuId"
        class="app-language-selector__menu"
        role="menu"
        :aria-label="t('language.selectorTitle')"
      >
        <button
          v-for="option in languageOptions"
          :key="option.value"
          type="button"
          class="app-language-selector__option"
          :class="{ selected: activeLanguage === option.value }"
          :disabled="disabled"
          role="menuitemradio"
          :aria-checked="activeLanguage === option.value"
          @click="selectLanguage(option.value)"
        >
          <span>{{ option.label }}</span>
          <b aria-hidden="true"></b>
        </button>
      </div>
    </template>
    <template v-else>
      <button
        v-for="option in languageOptions"
        :key="option.value"
        type="button"
        :class="{ selected: activeLanguage === option.value }"
        :disabled="disabled"
        :aria-pressed="activeLanguage === option.value"
        @click="selectLanguage(option.value)"
      >
        <span>{{ option.label }}</span>
        <b aria-hidden="true"></b>
      </button>
    </template>
  </div>
</template>

<style scoped>
.app-language-selector {
  display: grid;
  overflow: hidden;
  border: 1px solid var(--border);
  background: var(--control-bg, var(--card));
  box-shadow: var(--shadow-sm);
}

.app-language-selector button {
  min-width: 0;
  min-height: 58px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text);
  background: var(--card);
  border-bottom: 1px solid var(--border);
  font: inherit;
  text-align: left;
}

.app-language-selector button:last-child {
  border-bottom: 0;
}

.app-language-selector button:disabled {
  cursor: wait;
  opacity: 0.66;
}

.app-language-selector span {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  font-size: 14px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-language-selector b {
  width: 20px;
  height: 20px;
  margin-left: auto;
  flex: 0 0 auto;
  border: 2px solid var(--border-strong);
  border-radius: 999px;
}

.app-language-selector .selected b {
  border: 6px solid var(--color-teal);
}

.app-language-selector button:focus-visible {
  position: relative;
  z-index: 1;
  outline: 2px solid var(--focus-ring);
  outline-offset: -3px;
}

.app-language-selector--settings {
  border-radius: var(--radius-xl);
}

.app-language-selector--splash {
  position: absolute;
  z-index: 10;
  top: calc(18px + env(safe-area-inset-top));
  right: 16px;
  display: block;
  overflow: visible;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.app-language-selector--splash .app-language-selector__trigger {
  width: 44px;
  min-width: 44px;
  height: 44px;
  min-height: 44px;
  padding: 0;
  justify-content: center;
  color: var(--text);
  border: 0;
  border-radius: var(--radius-pill);
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
}

.app-language-selector--splash .app-language-selector__trigger svg {
  width: 21px;
  height: 21px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.app-language-selector--splash .app-language-selector__menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: min(218px, calc(100vw - 32px));
  padding: 6px;
  display: grid;
  gap: 2px;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--surface-elevated, var(--card));
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.18);
  backdrop-filter: blur(18px);
}

.app-language-selector--splash .app-language-selector__option {
  min-height: 42px;
  padding: 0 10px 0 12px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  text-align: center;
}

.app-language-selector--splash .app-language-selector__option span {
  font-size: 14px;
  font-weight: 800;
  text-align: left;
}

.app-language-selector--splash .app-language-selector__option b {
  width: 18px;
  height: 18px;
  border-width: 2px;
}

.app-language-selector--splash .app-language-selector__option.selected {
  color: var(--color-primary-deep);
  background: var(--control-bg-selected);
}

@media (hover: hover) {
  .app-language-selector--splash .app-language-selector__trigger:hover {
    color: var(--color-primary-deep);
    background: transparent;
  }

  .app-language-selector--splash .app-language-selector__option:hover {
    color: var(--color-primary-deep);
    background: var(--control-bg-hover);
  }
}

:global(:root[data-theme="dark"]) .app-language-selector,
:global(:root[data-theme="dark"]) .app-language-selector button {
  color: var(--text);
  background: var(--control-bg);
  border-color: var(--border);
  box-shadow: none;
}

:global(:root[data-theme="dark"]) .app-language-selector--splash {
  background: transparent;
}

:global(:root[data-theme="dark"]) .app-language-selector--splash .app-language-selector__trigger {
  background: transparent;
  border-color: transparent;
  box-shadow: none;
}

:global(:root[data-theme="dark"]) .app-language-selector--splash .app-language-selector__menu {
  background: var(--surface-elevated);
  border-color: var(--border);
  box-shadow: 0 18px 38px rgba(0, 0, 0, 0.36);
}

:global(:root[data-theme="dark"]) .app-language-selector--splash .app-language-selector__option.selected {
  color: var(--dark-soft-red-text);
  background: var(--control-bg-selected);
}

@media (hover: hover) {
  :global(:root[data-theme="dark"]) .app-language-selector button:not(.selected):hover,
  :global(:root[data-theme="dark"]) .app-language-selector--splash .app-language-selector__option:not(.selected):hover {
    color: var(--text);
    background: var(--control-bg-hover);
  }

  :global(:root[data-theme="dark"]) .app-language-selector--splash .app-language-selector__trigger:hover {
    color: var(--text);
    background: transparent;
  }
}
</style>
