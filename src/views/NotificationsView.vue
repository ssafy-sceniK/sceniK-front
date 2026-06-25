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
const showDeleteAllConfirm = ref(false);
const deletingAll = ref(false);
const deletingNotificationIds = ref([]);

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

function notificationKey(notification) {
  return notification.notificationId ?? notification.id;
}

function isDeletingNotification(notification) {
  const id = notificationKey(notification);
  return deletingNotificationIds.value.some((item) => String(item) === String(id));
}

async function deleteOne(notification) {
  const id = notificationKey(notification);
  if (!id || isDeletingNotification(notification)) return;
  deletingNotificationIds.value = [...deletingNotificationIds.value, id];
  await uiStore.deleteNotification(id);
  deletingNotificationIds.value = deletingNotificationIds.value.filter((item) => String(item) !== String(id));
}

function askDeleteAll() {
  showDeleteAllConfirm.value = true;
}

function closeDeleteAllConfirm() {
  if (!deletingAll.value) showDeleteAllConfirm.value = false;
}

async function confirmDeleteAll() {
  if (deletingAll.value) return;
  deletingAll.value = true;
  const ok = await uiStore.deleteAllNotifications();
  deletingAll.value = false;
  if (ok) showDeleteAllConfirm.value = false;
}

async function openNotification(notification) {
  await uiStore.markNotificationRead(notification.notificationId ?? notification.id);
  router.push(notification.to ?? '/community');
}

onMounted(loadNotifications);
</script>

<template>
  <AppLayout :title="t('notifications.title')" back back-to="/home" back-replace>
    <section class="utility-screen">
      <div class="utility-header">
        <p>{{ t('notifications.description') }}</p>
        <div v-if="notifications.length" class="notification-header-actions">
          <button type="button" @click="markAllRead">{{ t('notifications.markAllRead') }}</button>
          <button type="button" class="notification-delete-all-button" @click="askDeleteAll">{{ t('notifications.deleteAll') }}</button>
        </div>
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
        <motion.div
          v-for="(notification, index) in notifications"
          :key="notification.id"
          class="notification-row"
          :class="{ unread: !notification.read }"
          role="article"
          v-bind="motionVariants.listItem(index)"
        >
          <button type="button" class="notification-row-main" @click="openNotification(notification)">
            <span class="notification-content">
              <strong>{{ notification.title }}</strong>
              <small>{{ notification.subtitle }}</small>
            </span>
            <em>{{ notification.time }}</em>
          </button>
          <button
            type="button"
            class="notification-delete-button"
            :disabled="isDeletingNotification(notification)"
            :aria-label="t('notifications.deleteOne')"
            @click="deleteOne(notification)"
          >
            <span aria-hidden="true">×</span>
          </button>
        </motion.div>
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

      <div v-if="showDeleteAllConfirm" class="sheet-backdrop notification-confirm-backdrop" @click.self="closeDeleteAllConfirm">
        <section class="bottom-sheet notification-confirm-sheet" role="dialog" aria-modal="true" aria-labelledby="notification-delete-all-title">
          <h2 id="notification-delete-all-title">{{ t('notifications.deleteAllConfirmTitle') }}</h2>
          <p>{{ t('notifications.deleteAllConfirmText') }}</p>
          <div class="notification-confirm-actions">
            <button type="button" class="notification-confirm-cancel" :disabled="deletingAll" @click="closeDeleteAllConfirm">
              {{ t('common.cancel') }}
            </button>
            <button type="button" class="notification-confirm-delete" :disabled="deletingAll" @click="confirmDeleteAll">
              {{ deletingAll ? t('common.loading') : t('notifications.deleteConfirm') }}
            </button>
          </div>
        </section>
      </div>
    </section>
  </AppLayout>
</template>
