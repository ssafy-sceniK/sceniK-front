<script setup>
import { useRouter } from 'vue-router';
import BaseButton from '../components/common/BaseButton.vue';
import BrandLogo from '../components/brand/BrandLogo.vue';
import { GOOGLE_OAUTH_URL, KAKAO_OAUTH_URL } from '../api/authApi.js';

const router = useRouter();

function continueWithOAuth(provider, url) {
  sessionStorage.setItem('scenik-oauth-return-to', '/home');
  sessionStorage.setItem('scenik-oauth-provider', provider);
  window.location.assign(url);
}

function continueWithGoogle() {
  continueWithOAuth('google', GOOGLE_OAUTH_URL);
}

function continueWithKakao() {
  continueWithOAuth('kakao', KAKAO_OAUTH_URL);
}
</script>

<template>
  <main class="splash-screen">
    <section class="splash-mark">
      <BrandLogo size="splash" />
      <h1 class="sr-only">sceniK</h1>
      <p>좋아하는 K-콘텐츠 장면을 여행 코스로 이어보세요.</p>
    </section>
    <section class="splash-actions">
      <BaseButton block @click="router.push('/login')">로그인 / 회원가입</BaseButton>
      <button class="social-login-button social-login-button--google" type="button" @click="continueWithGoogle">
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.3c1.9-1.8 2.9-4.3 2.9-7.3Z"/>
          <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.5L15.4 17c-.9.6-2.1 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3v2.6A10 10 0 0 0 12 22Z"/>
          <path fill="#FBBC05" d="M6.4 13.9A6 6 0 0 1 6.1 12c0-.7.1-1.3.3-1.9V7.5H3A10 10 0 0 0 2 12c0 1.6.4 3.1 1 4.5l3.4-2.6Z"/>
          <path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.9 1.5l2.9-2.9A9.7 9.7 0 0 0 12 2a10 10 0 0 0-9 5.5l3.4 2.6C7.2 7.8 9.4 6 12 6Z"/>
        </svg>
        <span>Google 로그인</span>
      </button>
      <button class="social-login-button social-login-button--kakao" type="button" @click="continueWithKakao">
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path fill="#191919" d="M12 3C6.5 3 2 6.5 2 10.8c0 2.7 1.8 5.1 4.5 6.5l-1.1 4 4.6-3c.7.1 1.3.2 2 .2 5.5 0 10-3.5 10-7.7S17.5 3 12 3Z"/>
        </svg>
        <span>카카오 로그인</span>
      </button>
    </section>
  </main>
</template>
