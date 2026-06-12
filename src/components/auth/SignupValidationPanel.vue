<script setup>
import FormStatusNotice from '../common/FormStatusNotice.vue';

defineOptions({
  name: 'SignupValidationPanel',
});

const props = defineProps({
  emailTone: {
    type: String,
    default: 'warning',
  },
  emailMessage: {
    type: String,
    default: '',
  },
  passwordPolicy: {
    type: Array,
    default: () => [],
  },
  confirmEntered: {
    type: Boolean,
    default: false,
  },
  passwordMatches: {
    type: Boolean,
    default: false,
  },
  fieldErrors: {
    type: Array,
    default: () => [],
  },
  error: {
    type: String,
    default: '',
  },
  success: {
    type: String,
    default: '',
  },
});
</script>

<template>
  <section class="signup-validation-panel" aria-label="회원가입 검증 상태">
    <FormStatusNotice
      compact
      :tone="props.emailTone"
      title="이메일 확인"
      :text="props.emailMessage"
    />
    <ul class="password-policy-list" aria-label="비밀번호 정책">
      <li v-for="item in props.passwordPolicy" :key="item.label" :class="{ passed: item.passed }">
        <span aria-hidden="true">{{ item.passed ? '✓' : '•' }}</span>{{ item.label }}
      </li>
    </ul>
    <FormStatusNotice
      v-if="props.confirmEntered"
      compact
      :tone="props.passwordMatches ? 'success' : 'error'"
      title="비밀번호 확인"
      :text="props.passwordMatches ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.'"
    />
    <ul v-if="props.fieldErrors.length" class="signup-field-error-list" aria-label="회원가입 입력 오류">
      <li v-for="fieldError in props.fieldErrors" :key="`${fieldError.field}-${fieldError.message}`">
        <b v-if="fieldError.field">{{ fieldError.field }}</b>
        <span>{{ fieldError.message }}</span>
      </li>
    </ul>
    <FormStatusNotice v-if="props.error" tone="error" title="회원가입 실패" :text="props.error" />
    <FormStatusNotice v-if="props.success" tone="success" title="회원가입 완료" :text="props.success" />
  </section>
</template>

<style scoped>
.signup-validation-panel {
  display: grid;
  gap: 10px;
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

.signup-field-error-list {
  margin: -2px 0 0;
  padding: 10px 12px;
  display: grid;
  gap: 6px;
  color: var(--color-semantic-down);
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.16);
  border-radius: var(--radius-md);
  list-style: none;
  font-size: 12px;
  line-height: 1.45;
}

.signup-field-error-list li {
  display: flex;
  gap: 6px;
}

.signup-field-error-list b {
  flex: 0 0 auto;
}
</style>
