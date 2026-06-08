<script setup>
import { ref } from 'vue';
import AppLayout from '../components/layout/AppLayout.vue';
import { useUiStore } from '../stores/uiStore.js';

const uiStore = useUiStore();
const language = ref('ko');
const theme = ref('light');
const notificationToggles = ref({
  route: true,
  like: true,
  comment: true,
});
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
          <RouterLink to="/my/profile-edit">프로필 / 취향 수정</RouterLink>
          <button v-if="uiStore.currentUser" type="button" class="danger-text" @click="uiStore.logout()">로그아웃</button>
          <RouterLink v-else to="/login">로그인</RouterLink>
        </div>
      </div>
    </section>
  </AppLayout>
</template>
