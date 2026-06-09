<script setup>
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useUiStore } from '../stores/uiStore.js';
import { checkEmailAvailability } from '../api/authApi.js';
import { getUserMessage } from '../api/error.js';
import AppLayout from '../components/layout/AppLayout.vue';
import BaseButton from '../components/common/BaseButton.vue';
import FormStatusNotice from '../components/common/FormStatusNotice.vue';

const router = useRouter();
const uiStore = useUiStore();
const nickname = ref('');
const email = ref('');
const password = ref('');
const confirm = ref('');
const error = ref('');
const success = ref('');
const loading = ref(false);
const emailCheckStatus = ref('unchecked');
const emailCheckMessage = ref('이메일 중복 확인이 필요합니다.');
const checkingEmail = ref(false);

const trimmedEmail = computed(() => email.value.trim().toLowerCase());
const emailFormatValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail.value));
const passwordPolicy = computed(() => [
  {
    label: '8자 이상',
    passed: password.value.length >= 8,
  },
]);
const passwordValid = computed(() => passwordPolicy.value.every((item) => item.passed));
const passwordMatches = computed(() => Boolean(confirm.value) && password.value === confirm.value);
const canSubmit = computed(() => (
  nickname.value.trim()
  && emailCheckStatus.value === 'available'
  && passwordValid.value
  && passwordMatches.value
  && !loading.value
));

watch(email, () => {
  success.value = '';
  error.value = '';
  if (!trimmedEmail.value) {
    emailCheckStatus.value = 'unchecked';
    emailCheckMessage.value = '이메일 중복 확인이 필요합니다.';
    return;
  }
  emailCheckStatus.value = emailFormatValid.value ? 'unchecked' : 'invalid';
  emailCheckMessage.value = emailFormatValid.value
    ? '이메일을 확인한 뒤 중복 확인을 눌러 주세요.'
    : '올바른 이메일 형식이 아닙니다.';
});

watch([password, confirm], () => {
  success.value = '';
});

function emailNoticeTone() {
  if (emailCheckStatus.value === 'available') return 'success';
  if (['duplicate', 'invalid', 'error'].includes(emailCheckStatus.value)) return 'error';
  if (emailCheckStatus.value === 'checking') return 'info';
  return 'warning';
}

async function checkEmail() {
  error.value = '';
  success.value = '';
  if (!trimmedEmail.value) {
    emailCheckStatus.value = 'invalid';
    emailCheckMessage.value = '이메일을 입력해 주세요.';
    return;
  }
  if (!emailFormatValid.value) {
    emailCheckStatus.value = 'invalid';
    emailCheckMessage.value = '올바른 이메일 형식이 아닙니다.';
    return;
  }

  checkingEmail.value = true;
  emailCheckStatus.value = 'checking';
  emailCheckMessage.value = '이메일 사용 가능 여부를 확인하는 중입니다.';
  try {
    const result = await checkEmailAvailability(trimmedEmail.value);
    emailCheckStatus.value = result.available ? 'available' : 'duplicate';
    emailCheckMessage.value = result.message || (result.available ? '사용 가능한 이메일입니다.' : '이미 사용 중인 이메일입니다.');
  } catch (err) {
    emailCheckStatus.value = 'error';
    emailCheckMessage.value = getUserMessage(err, '이메일 중복 확인에 실패했습니다. 잠시 후 다시 시도해 주세요.');
  } finally {
    checkingEmail.value = false;
  }
}

async function submit() {
  error.value = '';
  success.value = '';
  const trimmedNickname = nickname.value.trim();

  if (!trimmedNickname) {
    error.value = '닉네임을 입력해 주세요.';
    return;
  }

  if (!trimmedEmail.value) {
    error.value = '이메일을 입력해 주세요.';
    return;
  }

  if (!emailFormatValid.value) {
    error.value = '올바른 이메일 형식이 아닙니다.';
    return;
  }

  if (emailCheckStatus.value !== 'available') {
    error.value = '회원가입 전에 이메일 중복 확인을 완료해 주세요.';
    return;
  }

  if (!password.value) {
    error.value = '비밀번호를 입력해 주세요.';
    return;
  }

  if (!passwordValid.value) {
    error.value = '비밀번호는 8자 이상이어야 합니다.';
    return;
  }

  if (!passwordMatches.value) {
    error.value = '비밀번호가 일치하지 않습니다.';
    return;
  }

  loading.value = true;
  try {
    await uiStore.signUp({ nickname: trimmedNickname, email: trimmedEmail.value, password: password.value });
    success.value = '회원가입이 완료되었습니다. 취향 설정으로 이동합니다.';
    window.setTimeout(() => router.push('/preferences'), 450);
  } catch (err) {
    error.value = getUserMessage(err, '회원가입에 실패했습니다.');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AppLayout title="회원가입" back hide-bottom>
    <form class="auth-form" @submit.prevent="submit">
      <div class="page-intro">
        <h1>sceniK 계정 만들기</h1>
        <p>취향을 저장하고 AI 코스, 좋아요, 방문 기록을 한곳에서 관리하세요.</p>
      </div>
      <label class="form-field">닉네임<input v-model="nickname" placeholder="닉네임 입력" /></label>
      <label class="form-field">
        이메일
        <span class="email-check-row">
          <input v-model="email" type="email" placeholder="email@example.com" autocomplete="email" />
          <button type="button" :disabled="checkingEmail || !emailFormatValid" @click="checkEmail">
            {{ checkingEmail ? '확인 중' : '중복 확인' }}
          </button>
        </span>
      </label>
      <FormStatusNotice
        compact
        :tone="emailNoticeTone()"
        title="이메일 확인"
        :text="emailCheckMessage"
      />
      <label class="form-field">비밀번호<input v-model="password" type="password" placeholder="8자 이상" autocomplete="new-password" /></label>
      <ul class="password-policy-list" aria-label="비밀번호 정책">
        <li v-for="item in passwordPolicy" :key="item.label" :class="{ passed: item.passed }">
          <span aria-hidden="true">{{ item.passed ? '✓' : '•' }}</span>{{ item.label }}
        </li>
      </ul>
      <label class="form-field">비밀번호 확인<input v-model="confirm" type="password" placeholder="다시 입력" autocomplete="new-password" /></label>
      <FormStatusNotice
        v-if="confirm"
        compact
        :tone="passwordMatches ? 'success' : 'error'"
        title="비밀번호 확인"
        :text="passwordMatches ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.'"
      />
      <FormStatusNotice v-if="error" tone="error" title="회원가입 실패" :text="error" />
      <FormStatusNotice v-if="success" tone="success" title="회원가입 완료" :text="success" />
      <BaseButton block :disabled="!canSubmit">{{ loading ? '가입 중...' : '가입 완료' }}</BaseButton>
    </form>
  </AppLayout>
</template>

<style scoped>
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

.password-policy-list {
  margin: -2px 0 2px;
  padding: 0;
  display: grid;
  gap: 6px;
  list-style: none;
}

.password-policy-list li {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
}

.password-policy-list li.passed {
  color: var(--color-semantic-up);
}

@media (max-width: 360px) {
  .email-check-row {
    grid-template-columns: 1fr;
  }
}
</style>
