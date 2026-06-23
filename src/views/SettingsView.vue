<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import AuthSessionPanel from '../components/auth/AuthSessionPanel.vue';
import { useUiStore } from '../stores/uiStore.js';
import { languageOptions, normalizeLocale, setLocale } from '../i18n/index.js';

const router = useRouter();
const uiStore = useUiStore();
const { t, locale } = useI18n();
const activeLanguage = computed(() => normalizeLocale(locale.value) || 'ko');
const languageSaving = ref(false);
const theme = computed({
  get: () => uiStore.theme,
  set: (value) => uiStore.setTheme(value),
});
const sessionNotice = ref(null);
const notificationToggles = ref({
  route: true,
  like: true,
  comment: true,
});

watch(() => uiStore.currentUser?.language, (language) => {
  const normalized = normalizeLocale(language);
  if (normalized && normalized !== activeLanguage.value) {
    setLocale(normalized);
  }
}, { immediate: true });

async function changeLanguage(language) {
  const normalized = setLocale(language);
  languageSaving.value = true;
  const saved = await uiStore.updateLanguage(normalized);
  languageSaving.value = false;
  uiStore.notify(saved ? t('settings.languageSaved') : t('settings.languageSaveFailed'), saved ? 'success' : 'info');
}

async function handleLogout() {
  sessionNotice.value = {
    tone: 'info',
    title: '세션 종료 중',
    text: '이 기기의 로그인 세션을 안전하게 종료하고 있습니다.',
  };
  try {
    await uiStore.logout();
    sessionNotice.value = {
      tone: 'success',
      title: '로그아웃되었습니다',
      text: '이 기기에서 세션이 종료되었습니다. 다시 이용하려면 로그인해 주세요.',
    };
    await router.replace('/');
  } catch {
    sessionNotice.value = {
      tone: 'error',
      title: '로그아웃 상태를 확인해 주세요',
      text: '로컬 세션은 정리했습니다. 화면이 갱신되지 않으면 다시 로그인해 주세요.',
    };
  }
}
</script>

<template>
  <AppLayout :title="t('settings.title')" back>
    <section class="utility-screen">
      <div class="settings-section">
        <h2>{{ t('language.selectorTitle') }}</h2>
        <p class="settings-helper">{{ t('language.selectorDescription') }}</p>
        <div class="settings-card">
          <button
            v-for="option in languageOptions"
            :key="option.value"
            type="button"
            :class="{ selected: activeLanguage === option.value }"
            :disabled="languageSaving"
            @click="changeLanguage(option.value)"
          >
            <span>{{ t(option.labelKey) }}</span><b></b>
          </button>
        </div>
      </div>

      <div class="settings-section">
        <h2>{{ t('settings.theme') }}</h2>
        <div class="settings-segment">
          <button type="button" :class="{ active: theme === 'light' }" @click="theme = 'light'">{{ t('settings.light') }}</button>
          <button type="button" :class="{ active: theme === 'dark' }" @click="theme = 'dark'">{{ t('settings.dark') }}</button>
        </div>
      </div>

      <div class="settings-section">
        <h2>{{ t('settings.notifications') }}</h2>
        <div class="settings-card">
          <button type="button" @click="notificationToggles.route = !notificationToggles.route">
            <span>{{ t('settings.routeNotifications') }}</span><b :class="{ on: notificationToggles.route }"></b>
          </button>
          <button type="button" @click="notificationToggles.like = !notificationToggles.like">
            <span>{{ t('settings.likeNotifications') }}</span><b :class="{ on: notificationToggles.like }"></b>
          </button>
          <button type="button" @click="notificationToggles.comment = !notificationToggles.comment">
            <span>{{ t('settings.commentNotifications') }}</span><b :class="{ on: notificationToggles.comment }"></b>
          </button>
        </div>
      </div>

      <div class="settings-section">
        <h2>{{ t('settings.account') }}</h2>
        <div class="settings-card">
          <RouterLink class="settings-action-row" to="/my/profile-edit">
            <span>{{ t('settings.profileEdit') }}</span>
            <em aria-hidden="true">›</em>
          </RouterLink>
          <button
            v-if="uiStore.currentUser"
            type="button"
            class="settings-action-row settings-action-row--logout"
            @click="handleLogout"
          >
            <span>{{ t('settings.logout') }}</span>
            <em aria-hidden="true">›</em>
          </button>
          <RouterLink v-else class="settings-action-row" to="/login">
            <span>{{ t('settings.login') }}</span>
            <em aria-hidden="true">›</em>
          </RouterLink>
        </div>
      </div>

      <div class="settings-section">
        <h2>{{ t('settings.session') }}</h2>
        <AuthSessionPanel
          :user="uiStore.currentUser"
          :notice="sessionNotice"
          @logout="handleLogout"
        />
      </div>
    </section>
  </AppLayout>
</template>