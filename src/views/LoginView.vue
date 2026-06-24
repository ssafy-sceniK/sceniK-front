<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useUiStore } from '../stores/uiStore.js';
import { getUserMessage } from '../api/error.js';
import AppLayout from '../components/layout/AppLayout.vue';
import BaseButton from '../components/common/BaseButton.vue';
import FormStatusNotice from '../components/common/FormStatusNotice.vue';
import { GOOGLE_OAUTH_URL, KAKAO_OAUTH_URL } from '../api/authApi.js';

const router = useRouter();
const route = useRoute();
const uiStore = useUiStore();
const { t } = useI18n();
const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);
const socialMessage = ref('');

function continueWithOAuth(provider, url) {
  socialMessage.value = '';
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

function retryLogin() {
  error.value = '';
}

async function submit() {
  error.value = '';
  const trimmedEmail = email.value.trim();

  if (!trimmedEmail) {
    error.value = t('auth.validation.emailRequired');
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    error.value = t('auth.validation.emailInvalid');
    return;
  }

  if (!password.value) {
    error.value = t('auth.validation.passwordRequired');
    return;
  }

  loading.value = true;
  try {
    await uiStore.login({ email: trimmedEmail, password: password.value });
    router.push(uiStore.preferencesCompleted ? '/home' : '/preferences');
  } catch (err) {
    error.value = getUserMessage(err, t('auth.login.failedFallback'));
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AppLayout :title="t('auth.login.title')" back hide-bottom>
    <form class="auth-form" @submit.prevent="submit">
      <div class="page-intro login-intro">
        <h1>{{ t('auth.login.heading') }}</h1>
        <p>{{ t('auth.login.subtitle') }}</p>
      </div>
      <FormStatusNotice
        v-if="route.query.reason === 'expired'"
        compact
        tone="warning"
        :title="t('auth.login.expiredTitle')"
        :text="t('auth.login.expiredText')"
      />
      <div class="social-login-group">
        <button class="social-login-button social-login-button--google" type="button" @click="continueWithGoogle">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.3c1.9-1.8 2.9-4.3 2.9-7.3Z"/>
            <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.5L15.4 17c-.9.6-2.1 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3v2.6A10 10 0 0 0 12 22Z"/>
            <path fill="#FBBC05" d="M6.4 13.9A6 6 0 0 1 6.1 12c0-.7.1-1.3.3-1.9V7.5H3A10 10 0 0 0 2 12c0 1.6.4 3.1 1 4.5l3.4-2.6Z"/>
            <path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.9 1.5l2.9-2.9A9.7 9.7 0 0 0 12 2a10 10 0 0 0-9 5.5l3.4 2.6C7.2 7.8 9.4 6 12 6Z"/>
          </svg>
          <span>{{ t('auth.login.google') }}</span>
        </button>
        <button class="social-login-button social-login-button--kakao" type="button" @click="continueWithKakao">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path fill="#191919" d="M12 3C6.5 3 2 6.5 2 10.8c0 2.7 1.8 5.1 4.5 6.5l-1.1 4 4.6-3c.7.1 1.3.2 2 .2 5.5 0 10-3.5 10-7.7S17.5 3 12 3Z"/>
          </svg>
          <span>{{ t('auth.login.kakao') }}</span>
        </button>
      </div>
      <FormStatusNotice
        v-if="socialMessage"
        compact
        tone="warning"
        :title="t('auth.login.socialNotice')"
        :text="socialMessage"
      />
      <div class="auth-divider"><span>{{ t('auth.login.or') }}</span></div>
      <label class="form-field">{{ t('auth.fields.email') }}<input v-model="email" type="email" placeholder="email@example.com" /></label>
      <label class="form-field">{{ t('auth.fields.password') }}<input v-model="password" type="password" :placeholder="t('auth.fields.password')" /></label>
      <FormStatusNotice
        v-if="error"
        compact
        class="auth-error-notice"
        tone="error"
        :title="t('auth.login.errorTitle')"
        :text="error"
      />
      <div class="auth-action-stack" :class="{ 'auth-action-stack--with-error': error }">
        <BaseButton block :disabled="loading">{{ loading ? t('auth.login.loading') : t('auth.login.submit') }}</BaseButton>
        <BaseButton v-if="error" variant="secondary" block type="button" @click="retryLogin">{{ t('common.retry') }}</BaseButton>
        <BaseButton variant="ghost" block type="button" @click="router.push('/signup')">{{ t('auth.signup.title') }}</BaseButton>
      </div>
    </form>
  </AppLayout>
</template>
