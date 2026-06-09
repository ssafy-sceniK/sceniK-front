<script setup>
import { ref } from 'vue';
import AppLayout from '../components/layout/AppLayout.vue';
import AuthSessionPanel from '../components/auth/AuthSessionPanel.vue';
import { useUiStore } from '../stores/uiStore.js';

const uiStore = useUiStore();
const language = ref('ko');
const theme = ref('light');
const sessionNotice = ref(null);
const notificationToggles = ref({
  route: true,
  like: true,
  comment: true,
});

async function handleLogout() {
  sessionNotice.value = {
    tone: 'info',
    title: '세션 종료 중',
    text: '이 기기의 로그인 세션을 안전하게 종료하고 있습니다.',
  };
  try {
    await uiStore.logout();
    sessionNotice.value = {
      tone: 'success',
      title: '로그아웃되었습니다.',
      text: '이 기기에서 세션이 종료되었습니다. 다시 이용하려면 로그인해 주세요.',
    };
  } catch {
    sessionNotice.value = {
      tone: 'error',
      title: '로그아웃 상태를 확인해 주세요.',
      text: '로컬 세션은 정리했습니다. 화면이 갱신되지 않으면 다시 로그인해 주세요.',
    };
  }
}
</script>

<template>
  <AppLayout title="설정" back>
    <section class="utility-screen">
      <div class="settings-section">
        <h2>언어</h2>
        <div class="settings-card">
          <button type="button" :class="{ selected: language === 'ko' }" @click="language = 'ko'">
            <span>한국어</span><b></b>
          </button>
          <button type="button" :class="{ selected: language === 'en' }" @click="language = 'en'">
            <span>English</span><b></b>
          </button>
        </div>
      </div>

      <div class="settings-section">
        <h2>테마</h2>
        <div class="settings-segment">
          <button type="button" :class="{ active: theme === 'light' }" @click="theme = 'light'">라이트</button>
          <button type="button" :class="{ active: theme === 'dark' }" @click="theme = 'dark'">다크 준비중</button>
        </div>
      </div>

      <div class="settings-section">
        <h2>알림 관리</h2>
        <div class="settings-card">
          <button type="button" @click="notificationToggles.route = !notificationToggles.route">
            <span>AI 코스 알림</span><b :class="{ on: notificationToggles.route }"></b>
          </button>
          <button type="button" @click="notificationToggles.like = !notificationToggles.like">
            <span>좋아요 알림</span><b :class="{ on: notificationToggles.like }"></b>
          </button>
          <button type="button" @click="notificationToggles.comment = !notificationToggles.comment">
            <span>댓글 알림</span><b :class="{ on: notificationToggles.comment }"></b>
          </button>
        </div>
      </div>

      <div class="settings-section">
        <h2>계정</h2>
        <div class="settings-card">
          <RouterLink class="settings-action-row" to="/my/profile-edit">
            <span>프로필 / 취향 수정</span>
            <em aria-hidden="true">›</em>
          </RouterLink>
          <button
            v-if="uiStore.currentUser"
            type="button"
            class="settings-action-row settings-action-row--logout"
            @click="uiStore.logout()"
          >
            <span>로그아웃</span>
            <em aria-hidden="true">›</em>
          </button>
          <RouterLink v-else class="settings-action-row" to="/login">
            <span>로그인</span>
            <em aria-hidden="true">›</em>
          </RouterLink>
        </div>
      </div>

      <div class="settings-section">
        <h2>세션 관리</h2>
        <AuthSessionPanel
          :user="uiStore.currentUser"
          :notice="sessionNotice"
          @logout="handleLogout"
        />
      </div>
    </section>
  </AppLayout>
</template>
