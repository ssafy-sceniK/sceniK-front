<script setup>
import { computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import BrandLogo from '../brand/BrandLogo.vue';
import { useUiStore } from '../../stores/uiStore.js';

const props = defineProps({
  title: { type: String, default: '' },
  back: { type: Boolean, default: false },
});

const router = useRouter();
const uiStore = useUiStore();
const unreadCount = computed(() => uiStore.unreadNotifications);

onMounted(() => {
  if (uiStore.currentUser) void uiStore.loadNotifications();
});

watch(() => uiStore.currentUser?.userId, (userId) => {
  if (userId) void uiStore.loadNotifications();
});
</script>

<template>
  <header class="top-nav">
    <button v-if="props.back" class="icon-button" type="button" aria-label="뒤로" @click="router.back()">
      ←
    </button>
    <RouterLink v-else-if="!props.title" to="/home" class="brand-mark" aria-label="sceniK home">
      <BrandLogo size="nav" />
    </RouterLink>
    <div v-else class="top-leading-spacer" aria-hidden="true"></div>

    <strong v-if="props.title" class="top-title">{{ props.title }}</strong>
    <div v-else class="top-spacer"></div>

    <div class="top-actions">
      <slot name="actions">
        <RouterLink class="icon-button notification-nav-button" to="/notifications" aria-label="알림">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9z" />
            <path d="M10 21h4" />
          </svg>
          <span v-if="unreadCount" class="notification-badge">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
        </RouterLink>
        <RouterLink class="icon-button" to="/settings" aria-label="설정">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
            <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.2a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.2a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1A2 2 0 0 1 7.1 4.3l.1.1a1.6 1.6 0 0 0 1.8.3 1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.2a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8 1.6 1.6 0 0 0 1.5 1h.2a2 2 0 0 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1z" />
          </svg>
        </RouterLink>
      </slot>
    </div>
  </header>
</template>
