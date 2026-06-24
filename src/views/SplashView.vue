<script setup>
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import BaseButton from '../components/common/BaseButton.vue';
import BrandLogo from '../components/brand/BrandLogo.vue';
import SplashBrandMark from '../components/brand/SplashBrandMark.vue';
import { GOOGLE_OAUTH_URL, KAKAO_OAUTH_URL } from '../api/authApi.js';

const { t } = useI18n();

const router = useRouter();

// \ub3d9\uc791\uc744 \ubd88\ud3b8\ud574\ud558\ub294 \uc0ac\uc6a9\uc790\uc5d0\uac8c\ub294 \uc560\ub2c8\uba54\uc774\uc158 \ub300\uc2e0 \uacf5\uc6a9 BrandLogo\ub97c \uc815\uc801\uc73c\ub85c \ubcf4\uc5ec\uc900\ub2e4.
const prefersReducedMotion =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
      <BrandLogo v-if="prefersReducedMotion" size="splash" />
      <SplashBrandMark v-else />
      <h1 class="sr-only">sceniK</h1>
      <p class="splash-tagline">{{ t('auth.splash.k1e373bd51e') }}</p>
    </section>
    <section class="splash-actions splash-actions--enter">
      <BaseButton block @click="router.push('/login')">{{ t('auth.splash.kc223fc66fe') }}</BaseButton>
      <button class="social-login-button social-login-button--google" type="button" @click="continueWithGoogle">
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.3c1.9-1.8 2.9-4.3 2.9-7.3Z"/>
          <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.5L15.4 17c-.9.6-2.1 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3v2.6A10 10 0 0 0 12 22Z"/>
          <path fill="#FBBC05" d="M6.4 13.9A6 6 0 0 1 6.1 12c0-.7.1-1.3.3-1.9V7.5H3A10 10 0 0 0 2 12c0 1.6.4 3.1 1 4.5l3.4-2.6Z"/>
          <path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.9 1.5l2.9-2.9A9.7 9.7 0 0 0 12 2a10 10 0 0 0-9 5.5l3.4 2.6C7.2 7.8 9.4 6 12 6Z"/>
        </svg>
        <span>{{ t('auth.splash.k743d8fac55') }}</span>
      </button>
      <button class="social-login-button social-login-button--kakao" type="button" @click="continueWithKakao">
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path fill="#191919" d="M12 3C6.5 3 2 6.5 2 10.8c0 2.7 1.8 5.1 4.5 6.5l-1.1 4 4.6-3c.7.1 1.3.2 2 .2 5.5 0 10-3.5 10-7.7S17.5 3 12 3Z"/>
        </svg>
        <span>{{ t('auth.splash.kb98181d829') }}</span>
      </button>
    </section>
  </main>
</template>

<style scoped>
/* 로고 애니메이션에 이어 태그라인과 버튼이 부드럽게 떠오른다 */
.splash-tagline {
  animation: splash-rise-up 0.6s 0.95s both ease-out;
}

.splash-actions--enter {
  animation: splash-rise-up 0.6s 1.25s both ease-out;
}

@keyframes splash-rise-up {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 동작을 불편해하는 사용자: 이동/페이드 없이 즉시 표시 */
@media (prefers-reduced-motion: reduce) {
  .splash-tagline,
  .splash-actions--enter {
    animation: none;
  }
}
</style>
