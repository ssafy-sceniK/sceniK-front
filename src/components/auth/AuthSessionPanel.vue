<script setup>
import { RouterLink } from 'vue-router';
import FormStatusNotice from '../common/FormStatusNotice.vue';

defineOptions({
  name: 'AuthSessionPanel',
});

const props = defineProps({
  user: {
    type: Object,
    default: null,
  },
  notice: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['logout']);
</script>

<template>
  <div class="auth-session-panel">
    <div class="settings-session-card">
      <div>
        <strong>{{ props.user ? `${props.user.nickname}님으로 로그인 중` : '로그인이 필요합니다' }}</strong>
        <p>
          {{ props.user
            ? '로그아웃하면 이 기기에서 세션이 종료되고 저장/댓글/팔로우 기능은 다시 로그인해야 사용할 수 있습니다.'
            : '로그인하면 저장한 코스, 댓글, 좋아요, 팔로우 정보를 이어서 사용할 수 있습니다.' }}
        </p>
      </div>
      <button
        v-if="props.user"
        type="button"
        class="session-logout-button"
        @click="emit('logout')"
      >
        로그아웃
      </button>
      <RouterLink v-else class="session-login-link" to="/login">로그인하기</RouterLink>
    </div>
    <FormStatusNotice
      v-if="props.notice"
      compact
      :tone="props.notice.tone"
      :title="props.notice.title"
      :text="props.notice.text"
    />
  </div>
</template>
