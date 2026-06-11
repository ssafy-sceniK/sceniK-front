<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUiStore } from '../stores/uiStore.js';
import AppLayout from '../components/layout/AppLayout.vue';
import BaseButton from '../components/common/BaseButton.vue';
import FormStatusNotice from '../components/common/FormStatusNotice.vue';

const route = useRoute();
const router = useRouter();
const uiStore = useUiStore();
const error = ref('');

const oauthErrorMessages = {
  access_denied: 'Google 로그인이 취소되었습니다.',
  oauth_authentication_failed: 'Google 인증에 실패했습니다. 다시 시도해 주세요.',
  oauth_account_processing_failed: 'Google 계정 정보를 처리하지 못했습니다.',
};

onMounted(async () => {
  const oauthError = Array.isArray(route.query.error) ? route.query.error[0] : route.query.error;
  const code = Array.isArray(route.query.code) ? route.query.code[0] : route.query.code;

  if (oauthError) {
    error.value = oauthErrorMessages[oauthError] ?? 'Google 로그인에 실패했습니다.';
    return;
  }
  if (!code) {
    error.value = '로그인 코드가 전달되지 않았습니다. 다시 시도해 주세요.';
    return;
  }

  try {
    await uiStore.completeOAuthLogin(code);
    const returnTo = sessionStorage.getItem('scenik-oauth-return-to') || '/home';
    sessionStorage.removeItem('scenik-oauth-return-to');
    await router.replace(returnTo);
  } catch (err) {
    error.value = err?.message || 'Google 로그인에 실패했습니다.';
  }
});
</script>

<template>
  <AppLayout title="Google 로그인" hide-bottom>
    <section class="oauth-callback">
      <div v-if="!error" class="oauth-callback__loading" role="status" aria-live="polite">
        <span class="oauth-spinner" aria-hidden="true"></span>
        <h1>로그인 정보를 확인하고 있어요</h1>
        <p>잠시만 기다려 주세요.</p>
      </div>
      <template v-else>
        <FormStatusNotice tone="error" title="Google 로그인 실패" :text="error" />
        <BaseButton block type="button" @click="router.replace('/login')">로그인 화면으로 돌아가기</BaseButton>
      </template>
    </section>
  </AppLayout>
</template>
