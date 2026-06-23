<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { readAccessToken } from '../api/authApi.js';
import { useUiStore } from '../stores/uiStore.js';
import AppLayout from '../components/layout/AppLayout.vue';
import EmptyState from '../components/common/EmptyState.vue';

const router = useRouter();
const uiStore = useUiStore();
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
  <AppLayout title="알림" back>
    <section class="utility-screen">
      <div class="utility-header">
        <p>커뮤니티 활동과 코스 업데이트를 모아 보여줍니다.</p>
        <button v-if="notifications.length" type="button" @click="markAllRead">모두 읽음</button>
      </div>

      <EmptyState
        v-if="loading"
        tone="loading"
        compact
        title="알림을 불러오는 중입니다"
        text="새 활동과 코스 업데이트를 확인하고 있어요."
      />
      <EmptyState
        v-else-if="error"
        icon="!"
        tone="error"
        compact
        title="알림을 불러오지 못했습니다"
        :text="error"
        action-label="다시 시도"
        @action="loadNotifications"
      />

      <div v-else-if="notifications.length" class="notification-list">
        <button
          v-for="notification in notifications"
          :key="notification.id"
          class="notification-row"
          :class="{ unread: !notification.read }"
          type="button"
          @click="openNotification(notification)"
        >
          <span class="notification-icon">!</span>
          <span>
            <strong>{{ notification.title }}</strong>
            <small>{{ notification.subtitle }}</small>
          </span>
          <em>{{ notification.time }}</em>
        </button>
      </div>

      <EmptyState
        v-else
        icon="!"
        tone="notification"
        :title="hasToken ? '새로운 알림이 없습니다' : '로그인하면 알림을 확인할 수 있습니다'"
        :text="hasToken ? '새 활동이 생기면 차분하게 정리해 알려드릴게요.' : '저장한 코스, 댓글, 좋아요 소식을 한곳에서 볼 수 있어요.'"
        :action-label="hasToken ? '커뮤니티 둘러보기' : '로그인하기'"
        :action-to="hasToken ? '/community' : '/login'"
      />
    </section>
  </AppLayout>
</template>
