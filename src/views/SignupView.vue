<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useUiStore } from '../stores/uiStore.js';
import { checkEmailAvailability } from '../api/authApi.js';
import { getFieldErrors, getUserMessage } from '../api/error.js';
import AppLayout from '../components/layout/AppLayout.vue';
import BaseButton from '../components/common/BaseButton.vue';
import SignupValidationPanel from '../components/auth/SignupValidationPanel.vue';

const router = useRouter();
const uiStore = useUiStore();
const { t } = useI18n();
const nickname = ref('');
const email = ref('');
const password = ref('');
const confirm = ref('');
const error = ref('');
const success = ref('');
const fieldErrors = ref([]);
const loading = ref(false);
const emailTouched = ref(false);
const emailDirty = ref(false);
const submitAttempted = ref(false);
const emailCheckStatus = ref('unchecked');
const emailCheckMessage = ref('');
const checkingEmail = ref(false);

const trimmedEmail = computed(() => email.value.trim().toLowerCase());
const emailFormatValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail.value));
const passwordPolicy = computed(() => [
  {
    label: t('auth.signup.passwordRuleLength'),
    passed: password.value.length >= 8,
  },
]);
const passwordValid = computed(() => passwordPolicy.value.every((item) => item.passed));
const passwordMatches = computed(() => Boolean(confirm.value) && password.value === confirm.value);
const confirmEntered = computed(() => Boolean(confirm.value));
const showEmailStatus = computed(() => emailDirty.value || emailTouched.value || submitAttempted.value || ['checking', 'available', 'duplicate', 'invalid', 'error'].includes(emailCheckStatus.value));
const showPasswordPolicy = computed(() => Boolean(password.value) || submitAttempted.value);
const showConfirmStatus = computed(() => confirmEntered.value || (submitAttempted.value && Boolean(password.value)));
const confirmStatusMessage = computed(() => (passwordMatches.value ? t('auth.signup.passwordMatch') : t('auth.validation.passwordMismatch')));
const canSubmit = computed(() => (
  nickname.value.trim()
  && emailCheckStatus.value === 'available'
  && passwordValid.value
  && passwordMatches.value
  && !loading.value
));

watch(email, () => {
  emailDirty.value = true;
  success.value = '';
  error.value = '';
  fieldErrors.value = [];
  if (!trimmedEmail.value) {
    emailCheckStatus.value = 'unchecked';
    emailCheckMessage.value = t('auth.signup.emailCheckRequired');
    return;
  }
  emailCheckStatus.value = emailFormatValid.value ? 'unchecked' : 'invalid';
  emailCheckMessage.value = emailFormatValid.value
    ? t('auth.signup.emailCheckPrompt')
    : t('auth.validation.emailInvalid');
});

watch([password, confirm], () => {
  success.value = '';
  error.value = '';
  fieldErrors.value = [];
});

function emailNoticeTone() {
  if (emailCheckStatus.value === 'available') return 'success';
  if (['duplicate', 'invalid', 'error'].includes(emailCheckStatus.value)) return 'error';
  if (emailCheckStatus.value === 'checking') return 'info';
  return 'warning';
}

function markEmailTouched() {
  emailTouched.value = true;
}

async function checkEmail() {
  emailTouched.value = true;
  error.value = '';
  success.value = '';
  if (!trimmedEmail.value) {
    emailCheckStatus.value = 'invalid';
    emailCheckMessage.value = t('auth.validation.emailRequired');
    return;
  }
  if (!emailFormatValid.value) {
    emailCheckStatus.value = 'invalid';
    emailCheckMessage.value = t('auth.validation.emailInvalid');
    return;
  }

  checkingEmail.value = true;
  emailCheckStatus.value = 'checking';
  emailCheckMessage.value = t('auth.signup.emailChecking');
  try {
    const result = await checkEmailAvailability(trimmedEmail.value);
    emailCheckStatus.value = result.available ? 'available' : 'duplicate';
    emailCheckMessage.value = result.message || (result.available ? t('auth.signup.emailAvailable') : t('auth.signup.emailDuplicate'));
  } catch (err) {
    fieldErrors.value = getFieldErrors(err);
    emailCheckStatus.value = 'error';
    emailCheckMessage.value = getUserMessage(err, t('auth.signup.emailCheckFailed'));
  } finally {
    checkingEmail.value = false;
  }
}

async function submit() {
  submitAttempted.value = true;
  emailTouched.value = true;
  error.value = '';
  success.value = '';
  fieldErrors.value = [];
  const trimmedNickname = nickname.value.trim();

  if (!trimmedNickname) {
    error.value = t('auth.validation.nicknameRequired');
    return;
  }

  if (!trimmedEmail.value) {
    emailCheckStatus.value = 'invalid';
    emailCheckMessage.value = t('auth.validation.emailRequired');
    return;
  }

  if (!emailFormatValid.value) {
    emailCheckStatus.value = 'invalid';
    emailCheckMessage.value = t('auth.validation.emailInvalid');
    return;
  }

  if (emailCheckStatus.value !== 'available') {
    emailCheckStatus.value = 'unchecked';
    emailCheckMessage.value = t('auth.signup.emailCheckBeforeSubmit');
    return;
  }

  if (!password.value) {
    return;
  }

  if (!passwordValid.value) {
    return;
  }

  if (!passwordMatches.value) {
    return;
  }

  loading.value = true;
  try {
    await uiStore.signUp({ nickname: trimmedNickname, email: trimmedEmail.value, password: password.value });
    success.value = t('auth.signup.success');
    window.setTimeout(() => router.push('/preferences'), 450);
  } catch (err) {
    fieldErrors.value = getFieldErrors(err);
    error.value = getUserMessage(err, t('auth.signup.failedFallback'));
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AppLayout :title="t('auth.signup.title')" back hide-bottom>
    <form class="auth-form auth-form--signup" @submit.prevent="submit">
      <div class="page-intro signup-intro">
        <h1>{{ t('auth.signup.heading') }}</h1>
        <p>{{ t('auth.signup.subtitle') }}</p>
      </div>
      <label class="form-field">{{ t('auth.fields.nickname') }}<input v-model="nickname" :placeholder="t('auth.signup.nicknamePlaceholder')" /></label>
      <label class="form-field">
        {{ t('auth.fields.email') }}
        <span class="email-check-row">
          <input v-model="email" type="email" placeholder="email@example.com" autocomplete="email" @blur="markEmailTouched" />
          <button type="button" :disabled="checkingEmail || !emailFormatValid" @click="checkEmail">
            {{ checkingEmail ? t('common.checking') : t('auth.signup.checkDuplicate') }}
          </button>
        </span>
        <p v-if="showEmailStatus" class="field-status field-status--email" :class="`field-status--${emailNoticeTone()}`">
          {{ emailCheckMessage }}
        </p>
      </label>
      <label class="form-field">
        {{ t('auth.fields.password') }}
        <input v-model="password" type="password" :placeholder="t('auth.signup.passwordPlaceholder')" autocomplete="new-password" />
        <ul v-if="showPasswordPolicy" class="field-status-list field-status-list--password" :aria-label="t('auth.fields.password')">
          <li v-for="item in passwordPolicy" :key="item.label" :class="{ passed: item.passed }">
            <span aria-hidden="true">{{ item.passed ? '\u2713' : '\u2022' }}</span>{{ item.label }}
          </li>
        </ul>
      </label>
      <label class="form-field">
        {{ t('auth.fields.passwordConfirm') }}
        <input v-model="confirm" type="password" :placeholder="t('auth.signup.passwordConfirmPlaceholder')" autocomplete="new-password" />
        <p v-if="showConfirmStatus" class="field-status field-status--confirm" :class="passwordMatches ? 'field-status--success' : 'field-status--error'">
          {{ confirmStatusMessage }}
        </p>
      </label>
      <SignupValidationPanel
        :field-errors="fieldErrors"
        :error="error"
        :success="success"
      />
      <BaseButton class="signup-submit" block :disabled="!canSubmit">{{ loading ? t('auth.signup.loading') : t('auth.signup.submit') }}</BaseButton>
    </form>
  </AppLayout>
</template>

<style scoped>
.auth-form--signup {
  padding-bottom: calc(var(--bottom-nav-height) + 28px);
}

.signup-intro {
  padding: 24px 0 22px;
}

.signup-intro h1 {
  max-width: 320px;
  margin-bottom: 10px;
  font-size: 24px;
  font-weight: 760;
  line-height: 1.28;
  letter-spacing: 0;
}

.signup-intro p {
  max-width: 340px;
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  letter-spacing: 0;
}

.email-check-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
}

.email-check-row button {
  min-height: 40px;
  padding: 0 12px;
  color: var(--color-primary);
  background: var(--color-primary-soft);
  border: 1px solid rgba(0, 82, 255, 0.14);
  border-radius: var(--radius-md);
  font-size: 12px;
  font-weight: 850;
}

.email-check-row button:disabled {
  color: var(--dim);
  background: var(--color-surface-strong);
}

.field-status {
  margin: -2px 0 0;
  color: var(--muted);
  font-size: 12px;
  font-weight: 750;
  line-height: 1.45;
}

.field-status--success {
  color: var(--color-semantic-up);
}

.field-status--error {
  color: var(--color-semantic-down);
}

.field-status--warning {
  color: var(--color-accent-yellow);
}

.field-status--info {
  color: var(--color-primary);
}

.field-status-list {
  margin: -2px 0 0;
  padding: 0;
  display: grid;
  gap: 6px;
  list-style: none;
}

.field-status-list li {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 750;
  line-height: 1.45;
}

.field-status-list li.passed {
  color: var(--color-semantic-up);
}

.signup-submit {
  margin-top: 12px;
}

@media (max-width: 360px) {
  .email-check-row {
    grid-template-columns: 1fr;
  }
}
</style>
