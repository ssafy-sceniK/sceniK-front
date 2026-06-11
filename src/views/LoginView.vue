<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUiStore } from '../stores/uiStore.js';
import { getUserMessage } from '../api/error.js';
import AppLayout from '../components/layout/AppLayout.vue';
import BaseButton from '../components/common/BaseButton.vue';
import FormStatusNotice from '../components/common/FormStatusNotice.vue';
import { GOOGLE_OAUTH_URL } from '../api/authApi.js';

const router = useRouter();
const route = useRoute();
const uiStore = useUiStore();
const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);
const socialMessage = ref('');

function continueWithGoogle() {
  socialMessage.value = '';
  sessionStorage.setItem('scenik-oauth-return-to', '/home');
  window.location.assign(GOOGLE_OAUTH_URL);
}

function continueWithKakao() {
  socialMessage.value = '카카오 로그인은 아직 준비 중입니다.';
}

function retryLogin() {
  error.value = '';
}

async function submit() {
  error.value = '';
  const trimmedEmail = email.value.trim();

  if (!trimmedEmail) {
    error.value = '이메일을 입력해 주세요.';
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    error.value = '올바른 이메일 형식이 아닙니다.';
    return;
  }

  if (!password.value) {
    error.value = '비밀번호를 입력해 주세요.';
    return;
  }

  loading.value = true;
  try {
    await uiStore.login({ email: trimmedEmail, password: password.value });
    router.push('/home');
  } catch (err) {
    error.value = getUserMessage(err, '로그인에 실패했습니다.');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AppLayout title="로그인" back hide-bottom>
    <form class="auth-form" @submit.prevent="submit">
      <div class="page-intro login-intro">
        <h1>다시 만나서 반가워요</h1>
        <p>계정으로 로그인하면 저장한 코스와 방문 상태를 이어서 볼 수 있어요.</p>
      </div>
      <FormStatusNotice
        v-if="route.query.reason === 'expired'"
        compact
        tone="warning"
        title="로그인 시간이 만료되었습니다."
        text="다시 로그인해 주세요."
      />
      <div class="social-login-group">
        <button class="social-login-button social-login-button--google" type="button" @click="continueWithGoogle">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.3c1.9-1.8 2.9-4.3 2.9-7.3Z"/>
            <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.5L15.4 17c-.9.6-2.1 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3v2.6A10 10 0 0 0 12 22Z"/>
            <path fill="#FBBC05" d="M6.4 13.9A6 6 0 0 1 6.1 12c0-.7.1-1.3.3-1.9V7.5H3A10 10 0 0 0 2 12c0 1.6.4 3.1 1 4.5l3.4-2.6Z"/>
            <path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.9 1.5l2.9-2.9A9.7 9.7 0 0 0 12 2a10 10 0 0 0-9 5.5l3.4 2.6C7.2 7.8 9.4 6 12 6Z"/>
          </svg>
          <span>구글로 계속하기</span>
        </button>
        <button class="social-login-button social-login-button--kakao" type="button" @click="continueWithKakao">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path fill="#191919" d="M12 3C6.5 3 2 6.5 2 10.8c0 2.7 1.8 5.1 4.5 6.5l-1.1 4 4.6-3c.7.1 1.3.2 2 .2 5.5 0 10-3.5 10-7.7S17.5 3 12 3Z"/>
          </svg>
          <span>카카오로 계속하기</span>
        </button>
      </div>
      <FormStatusNotice
        v-if="socialMessage"
        compact
        tone="warning"
        title="소셜 로그인 안내"
        :text="socialMessage"
      />
      <div class="auth-divider"><span>또는</span></div>
      <label class="form-field">이메일<input v-model="email" type="email" placeholder="email@example.com" /></label>
      <label class="form-field">비밀번호<input v-model="password" type="password" placeholder="비밀번호" /></label>
      <FormStatusNotice
        v-if="error"
        compact
        class="auth-error-notice"
        tone="error"
        title="로그인 실패"
        :text="error"
      />
      <div class="auth-action-stack" :class="{ 'auth-action-stack--with-error': error }">
        <BaseButton block :disabled="loading">{{ loading ? '로그인 중...' : '로그인' }}</BaseButton>
        <BaseButton v-if="error" variant="secondary" block type="button" @click="retryLogin">다시 시도</BaseButton>
        <BaseButton variant="ghost" block type="button" @click="router.push('/signup')">회원가입</BaseButton>
      </div>
    </form>
  </AppLayout>
</template>
