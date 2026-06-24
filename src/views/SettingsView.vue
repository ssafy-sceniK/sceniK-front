<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import AppLanguageSelector from '../components/common/AppLanguageSelector.vue';
import { useUiStore } from '../stores/uiStore.js';
import { normalizeLocale, setLocale } from '../i18n/index.js';

const router = useRouter();
const uiStore = useUiStore();
const { t, locale } = useI18n();
const activeLanguage = computed(() => normalizeLocale(locale.value) || 'ko');
const languageSaving = ref(false);
const theme = computed({
  get: () => uiStore.theme,
  set: (value) => uiStore.setTheme(value),
});
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

async function saveLanguagePreference(language) {
  const normalized = normalizeLocale(language) || 'ko';
  languageSaving.value = true;

  try {
    const saved = await uiStore.updateLanguage(normalized);
    uiStore.notify(saved ? t('settings.languageSaved') : t('settings.languageSaveFailed'), saved ? 'success' : 'info');
  } catch {
    uiStore.notify(t('settings.languageSaveFailed'), 'info');
  } finally {
    languageSaving.value = false;
  }
}

async function handleLogout() {
  try {
    await uiStore.logout();
    uiStore.notify(t('settings.cleanup.kc86f11a43e'), 'success');
    await router.replace('/');
  } catch {
    uiStore.notify(t('settings.cleanup.k03215b6cf5'), 'info');
  }
}
</script>

<template>
  <AppLayout :title="t('settings.title')" back>
    <section class="utility-screen">
      <div class="settings-section">
        <h2>{{ t('language.selectorTitle') }}</h2>
        <p class="settings-helper">{{ t('language.selectorDescription') }}</p>
        <AppLanguageSelector variant="settings" :disabled="languageSaving" @change="saveLanguagePreference" />
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
    </section>
  </AppLayout>
</template>
