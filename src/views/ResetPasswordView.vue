<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import BaseButton from '../components/common/BaseButton.vue';
import FormStatusNotice from '../components/common/FormStatusNotice.vue';
import { confirmPasswordReset } from '../api/authApi.js';
import { getUserMessage } from '../api/error.js';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const token = computed(() => String(route.query.token ?? '').trim());
const password = ref('');
const confirm = ref('');
const loading = ref(false);
const error = ref('');
const completed = ref(false);

async function submit() {
  error.value = '';
  if (!token.value) {
    error.value = t('auth.passwordReset.invalidLink');
    return;
  }
  if (password.value.length < 8) {
    error.value = t('auth.validation.passwordTooShort');
    return;
  }
  if (password.value !== confirm.value) {
    error.value = t('auth.validation.passwordMismatch');
    return;
  }
  loading.value = true;
  try {
    await confirmPasswordReset(token.value, password.value);
    completed.value = true;
    window.setTimeout(() => router.replace('/login'), 1200);
  } catch (requestError) {
    error.value = getUserMessage(requestError, t('auth.passwordReset.confirmFailed'));
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AppLayout :title="t('auth.passwordReset.confirmTitle')" back hide-bottom>
    <form class="auth-form" @submit.prevent="submit">
      <div class="page-intro login-intro">
        <h1>{{ t('auth.passwordReset.confirmHeading') }}</h1>
        <p>{{ t('auth.passwordReset.confirmDescription') }}</p>
      </div>
      <FormStatusNotice v-if="completed" tone="success" :title="t('auth.passwordReset.completeTitle')" :text="t('auth.passwordReset.completeText')" />
      <FormStatusNotice v-if="error" tone="error" :title="t('auth.passwordReset.confirmFailed')" :text="error" />
      <label>
        {{ t('auth.fields.password') }}
        <input v-model="password" type="password" autocomplete="new-password" :placeholder="t('auth.signup.passwordPlaceholder')" />
      </label>
      <label>
        {{ t('auth.fields.passwordConfirm') }}
        <input v-model="confirm" type="password" autocomplete="new-password" :placeholder="t('auth.signup.passwordConfirmPlaceholder')" />
      </label>
      <BaseButton block type="submit" :disabled="loading || completed">{{ loading ? t('common.loading') : t('auth.passwordReset.confirmSubmit') }}</BaseButton>
    </form>
  </AppLayout>
</template>
