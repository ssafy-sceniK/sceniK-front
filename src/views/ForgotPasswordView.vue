<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import AppLayout from '../components/layout/AppLayout.vue';
import BaseButton from '../components/common/BaseButton.vue';
import FormStatusNotice from '../components/common/FormStatusNotice.vue';
import { requestPasswordReset } from '../api/authApi.js';
import { getUserMessage } from '../api/error.js';

const { t } = useI18n();
const email = ref('');
const loading = ref(false);
const error = ref('');
const sent = ref(false);

async function submit() {
  const normalizedEmail = email.value.trim();
  error.value = '';
  sent.value = false;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    error.value = t('auth.passwordReset.emailInvalid');
    return;
  }
  loading.value = true;
  try {
    await requestPasswordReset(normalizedEmail);
    sent.value = true;
  } catch (requestError) {
    error.value = getUserMessage(requestError, t('auth.passwordReset.requestFailed'));
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AppLayout :title="t('auth.passwordReset.requestTitle')" back hide-bottom>
    <form class="auth-form" @submit.prevent="submit">
      <div class="page-intro login-intro">
        <h1>{{ t('auth.passwordReset.requestHeading') }}</h1>
        <p>{{ t('auth.passwordReset.requestDescription') }}</p>
      </div>
      <FormStatusNotice v-if="sent" tone="success" :title="t('auth.passwordReset.sentTitle')" :text="t('auth.passwordReset.sentText')" />
      <FormStatusNotice v-if="error" tone="error" :title="t('auth.passwordReset.requestFailed')" :text="error" />
      <label class="form-field password-reset-email-field">
        {{ t('auth.fields.email') }}
        <input v-model="email" type="email" autocomplete="email" placeholder="email@example.com" />
      </label>
      <BaseButton class="password-reset-submit" block type="submit" :disabled="loading">{{ loading ? t('common.loading') : t('auth.passwordReset.requestSubmit') }}</BaseButton>
    </form>
  </AppLayout>
</template>

<style scoped>
.password-reset-submit {
  margin-top: 6px;
}
</style>
