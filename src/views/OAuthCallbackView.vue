<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useUiStore } from '../stores/uiStore.js';
import AppLayout from '../components/layout/AppLayout.vue';
import BaseButton from '../components/common/BaseButton.vue';
import FormStatusNotice from '../components/common/FormStatusNotice.vue';

const route = useRoute();
const router = useRouter();
const uiStore = useUiStore();
const { t } = useI18n();
const error = ref('');
const provider = ref('oauth');

const providerName = computed(() => ({ google: 'Google', kakao: 'Kakao' })[provider.value] ?? t('auth.oauth.providerSocial'));
const title = computed(() => t('auth.oauth.title', { provider: providerName.value }));

function oauthErrorMessage(code) {
  const key = {
    access_denied: 'cancelled',
    oauth_authentication_failed: 'authFailed',
    oauth_account_processing_failed: 'accountFailed',
    oauth_email_required: 'emailRequired',
    oauth_email_not_verified: 'emailNotVerified',
  }[code];
  return key ? t('auth.oauth.errors.' + key) : t('auth.oauth.failed', { provider: providerName.value });
}

onMounted(async () => {
  const oauthError = Array.isArray(route.query.error) ? route.query.error[0] : route.query.error;
  const code = Array.isArray(route.query.code) ? route.query.code[0] : route.query.code;
  const queryProvider = Array.isArray(route.query.provider) ? route.query.provider[0] : route.query.provider;
  provider.value = queryProvider || sessionStorage.getItem('scenik-oauth-provider') || 'oauth';
  sessionStorage.removeItem('scenik-oauth-provider');

  if (oauthError) {
    error.value = oauthErrorMessage(oauthError);
    return;
  }
  if (!code) {
    error.value = t('auth.oauth.missingCode');
    return;
  }

  try {
    await uiStore.completeOAuthLogin(code, provider.value);
    const returnTo = uiStore.preferencesCompleted
      ? sessionStorage.getItem('scenik-oauth-return-to') || '/home'
      : '/preferences';
    sessionStorage.removeItem('scenik-oauth-return-to');
    await router.replace(returnTo);
  } catch (err) {
    error.value = err?.message || t('auth.oauth.failed', { provider: providerName.value });
  }
});
</script>

<template>
  <AppLayout :title="title" hide-bottom>
    <section class="oauth-callback">
      <div v-if="!error" class="oauth-callback__loading" role="status" aria-live="polite">
        <span class="oauth-spinner" aria-hidden="true"></span>
        <h1>{{ t('auth.oauth.loadingTitle') }}</h1>
        <p>{{ t('auth.oauth.loadingText') }}</p>
      </div>
      <template v-else>
        <FormStatusNotice tone="error" :title="t('auth.oauth.errorTitle', { provider: providerName })" :text="error" />
        <BaseButton block type="button" @click="router.replace('/login')">{{ t('auth.oauth.backToLogin') }}</BaseButton>
      </template>
    </section>
  </AppLayout>
</template>
