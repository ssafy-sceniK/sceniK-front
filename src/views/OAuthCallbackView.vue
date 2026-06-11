<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUiStore } from '../stores/uiStore.js';
import AppLayout from '../components/layout/AppLayout.vue';
import BaseButton from '../components/common/BaseButton.vue';
import FormStatusNotice from '../components/common/FormStatusNotice.vue';

const route = useRoute();
const router = useRouter();
const uiStore = useUiStore();
const error = ref('');
const provider = ref('oauth');

const providerName = computed(() => ({ google: 'Google', kakao: '카카오' })[provider.value] ?? '소셜');

const oauthErrorMessages = {
  access_denied: '로그인이 취소되었습니다.',
  oauth_authentication_failed: '인증에 실패했습니다. 다시 시도해 주세요.',
  oauth_account_processing_failed: '계정 정보를 처리하지 못했습니다.',
  oauth_email_required: '로그인하려면 계정 이메일 제공에 동의해 주세요.',
  oauth_email_not_verified: '인증된 이메일이 있는 계정으로 로그인해 주세요.',
};

onMounted(async () => {
  const oauthError = Array.isArray(route.query.error) ? route.query.error[0] : route.query.error;
  const code = Array.isArray(route.query.code) ? route.query.code[0] : route.query.code;
  const queryProvider = Array.isArray(route.query.provider) ? route.query.provider[0] : route.query.provider;
  provider.value = queryProvider || sessionStorage.getItem('scenik-oauth-provider') || 'oauth';
  sessionStorage.removeItem('scenik-oauth-provider');

  if (oauthError) {
    error.value = oauthErrorMessages[oauthError] ?? `${providerName.value} 로그인에 실패했습니다.`;
    return;
  }
  if (!code) {
    error.value = '로그인 코드가 전달되지 않았습니다. 다시 시도해 주세요.';
    return;
  }

  try {
    await uiStore.completeOAuthLogin(code, provider.value);
    const returnTo = sessionStorage.getItem('scenik-oauth-return-to') || '/home';
    sessionStorage.removeItem('scenik-oauth-return-to');
    await router.replace(returnTo);
  } catch (err) {
    error.value = err?.message || `${providerName.value} 로그인에 실패했습니다.`;
  }
});
</script>

<template>
  <AppLayout :title="`${providerName} 로그인`" hide-bottom>
    <section class="oauth-callback">
      <div v-if="!error" class="oauth-callback__loading" role="status" aria-live="polite">
        <span class="oauth-spinner" aria-hidden="true"></span>
        <h1>로그인 정보를 확인하고 있어요</h1>
        <p>잠시만 기다려 주세요.</p>
      </div>
      <template v-else>
        <FormStatusNotice tone="error" :title="`${providerName} 로그인 실패`" :text="error" />
        <BaseButton block type="button" @click="router.replace('/login')">로그인 화면으로 돌아가기</BaseButton>
      </template>
    </section>
  </AppLayout>
</template>
