<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { motion } from 'motion-v';
import { readAccessToken } from '../api/authApi.js';
import { useUiStore } from '../stores/uiStore.js';
import AppLayout from '../components/layout/AppLayout.vue';
import EmptyState from '../components/common/EmptyState.vue';
import { motionVariants } from '../utils/motion.js';

const router = useRouter();
const uiStore = useUiStore();
const { t } = useI18n();
const notifications = computed(() => uiStore.notifications);
const error = computed(() => uiStore.notificationsError);
const loading = computed(() => uiStore.notificationsLoading);
const hasToken = ref(Boolean(readAccessToken()));

async function loadNotifications() {
  hasToken.value = Boolean(readAccessToken());
  if (!readAccessToken()) {
    uiStore.notifications = [];
    return;
  }
  await uiStore.loadNotifications();
}

function markAllRead() {
  void uiStore.markAllNotificationsRead();
}

async function openNotification(notification) {
  await uiStore.markNotificationRead(notification.notificationId ?? notification.id);
  router.push(notification.to ?? '/community');
}

onMounted(loadNotifications);
</script>

<template>
  <AppLayout :title="t('notifications.title')" back>
    <section class="utility-screen">
      <div class="utility-header">
        <p>{{ t('notifications.description') }}</p>
        <button v-if="notifications.length" type="button" @click="markAllRead">{{ t('notifications.markAllRead') }}</button>
      </div>

      <EmptyState
        v-if="loading"
        tone="loading"
        compact
        :title="t('notifications.loadingTitle')"
        :text="t('notifications.loadingText')"
      />
      <EmptyState
        v-else-if="error"
        icon="!"
        tone="error"
        compact
        :title="t('notifications.errorTitle')"
        :text="error"
        :action-label="t('common.retry')"
        @action="loadNotifications"
      />

      <div v-else-if="notifications.length" class="notification-list">
        <motion.button
          v-for="(notification, index) in notifications"
          :key="notification.id"
          class="notification-row"
          :class="{ unread: !notification.read }"
          type="button"
          v-bind="motionVariants.listItem(index)"
          @click="openNotification(notification)"
        >
          <span class="notification-icon">!</span>
          <span>
            <strong>{{ notification.title }}</strong>
            <small>{{ notification.subtitle }}</small>
          </span>
          <em>{{ notification.time }}</em>
        </motion.button>
      </div>

      <EmptyState
        v-else
        icon="!"
        tone="notification"
        :title="hasToken ? t('notifications.emptyTitle') : t('notifications.loginTitle')"
        :text="hasToken ? t('notifications.emptyText') : t('notifications.loginText')"
        :action-label="hasToken ? t('notifications.communityAction') : t('settings.login')"
        :action-to="hasToken ? '/community' : '/login'"
      />
    </section>
  </AppLayout>
</template>
