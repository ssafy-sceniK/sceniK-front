<script setup>
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';
import FormStatusNotice from '../common/FormStatusNotice.vue';

const { t } = useI18n();

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
        <strong>{{ props.user ? t('auth.cleanup.k8dfd422e0d', { value0: props.user.nickname }) : t('auth.cleanup.kd04aebf093') }}</strong>
        <p>
          {{ props.user
            ? t('auth.cleanup.k12e7761e16')
            : t('auth.cleanup.k493ab4993f') }}
        </p>
      </div>
      <button
        v-if="props.user"
        type="button"
        class="session-logout-button"
        @click="emit('logout')"
      >
        {{ t('settings.logout') }}
      </button>
      <RouterLink v-else class="session-login-link" to="/login">{{ t('auth.cleanup.k112049a2c8') }}</RouterLink>
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
