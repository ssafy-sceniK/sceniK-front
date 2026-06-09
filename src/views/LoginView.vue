<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUiStore } from '../stores/uiStore.js';
import { getUserMessage } from '../api/error.js';
import AppLayout from '../components/layout/AppLayout.vue';
import BaseButton from '../components/common/BaseButton.vue';
import FormStatusNotice from '../components/common/FormStatusNotice.vue';

const router = useRouter();
const route = useRoute();
const uiStore = useUiStore();
const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

function retryLogin() {
  error.value = '';
}

async function submit() {
  error.value = '';
  const trimmedEmail = email.value.trim();

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

  loading.value = true;
  try {
    await uiStore.login({ email: trimmedEmail, password: password.value });
    router.push('/home');
  } catch (err) {
    error.value = getUserMessage(err, '로그인에 실패했습니다.');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AppLayout title="로그인" back hide-bottom>
    <form class="auth-form" @submit.prevent="submit">
      <div class="page-intro">
        <h1>다시 만나서 반가워요</h1>
        <p>계정으로 로그인하면 저장한 코스와 방문 상태를 이어서 볼 수 있어요.</p>
      </div>
      <FormStatusNotice
        v-if="route.query.reason === 'expired'"
        compact
        tone="warning"
        title="로그인 시간이 만료되었습니다."
        text="다시 로그인해 주세요."
      />
      <label class="form-field">이메일<input v-model="email" type="email" placeholder="email@example.com" /></label>
      <label class="form-field">비밀번호<input v-model="password" type="password" placeholder="비밀번호" /></label>
      <FormStatusNotice
        v-if="error"
        tone="error"
        title="로그인 실패"
        :text="`${error} 이메일과 비밀번호를 확인한 뒤 다시 시도해 주세요.`"
      />
      <BaseButton block :disabled="loading">{{ loading ? '로그인 중...' : '로그인' }}</BaseButton>
      <BaseButton v-if="error" variant="secondary" block type="button" @click="retryLogin">다시 시도</BaseButton>
      <BaseButton variant="ghost" block type="button" @click="router.push('/signup')">회원가입</BaseButton>
    </form>
  </AppLayout>
</template>
