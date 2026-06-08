<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUiStore } from '../stores/uiStore.js';
import { getUserMessage } from '../api/error.js';
import AppLayout from '../components/layout/AppLayout.vue';
import BaseButton from '../components/common/BaseButton.vue';

const router = useRouter();
const uiStore = useUiStore();
const nickname = ref('');
const email = ref('');
const password = ref('');
const confirm = ref('');
const error = ref('');
const loading = ref(false);

async function submit() {
  error.value = '';
  const trimmedNickname = nickname.value.trim();
  const trimmedEmail = email.value.trim();

  if (!trimmedNickname) {
    error.value = '닉네임을 입력해 주세요.';
    return;
  }

  if (!trimmedEmail) {
    error.value = '이메일을 입력해 주세요.';
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    error.value = '올바른 이메일 형식이 아닙니다.';
    return;
  }

  if (!password.value) {
    error.value = '비밀번호를 입력해 주세요.';
    return;
  }

  if (password.value.length < 8) {
    error.value = '비밀번호는 8자 이상이어야 합니다.';
    return;
  }

  if (password.value !== confirm.value) {
    error.value = '비밀번호가 일치하지 않습니다.';
    return;
  }

  loading.value = true;
  try {
    await uiStore.signUp({ nickname: trimmedNickname, email: trimmedEmail, password: password.value });
    router.push('/preferences');
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
      <label class="form-field">이메일<input v-model="email" type="email" placeholder="email@example.com" /></label>
      <label class="form-field">비밀번호<input v-model="password" type="password" placeholder="8자 이상" /></label>
      <label class="form-field">비밀번호 확인<input v-model="confirm" type="password" placeholder="다시 입력" /></label>
      <p v-if="error" class="form-error">{{ error }}</p>
      <BaseButton block :disabled="loading">{{ loading ? '가입 중...' : '가입 완료' }}</BaseButton>
    </form>
  </AppLayout>
</template>
