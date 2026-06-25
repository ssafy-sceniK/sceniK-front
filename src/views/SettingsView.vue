<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import AppLanguageSelector from '../components/common/AppLanguageSelector.vue';
import { useUiStore } from '../stores/uiStore.js';
import { normalizeLocale, setLocale } from '../i18n/index.js';
import { utilityBackTo } from '../utils/utilityNavigation.js';

const router = useRouter();
const route = useRoute();
const uiStore = useUiStore();
const { t, locale } = useI18n();
const activeLanguage = computed(() => normalizeLocale(locale.value) || 'ko');
const utilityBackTarget = computed(() => utilityBackTo(route));
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
const showAccountDeleteDialog = ref(false);
const accountDeleting = ref(false);
const accountDeleteError = ref('');

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

function openAccountDeleteDialog() {
  accountDeleteError.value = '';
  showAccountDeleteDialog.value = true;
}

function closeAccountDeleteDialog() {
  if (accountDeleting.value) return;
  showAccountDeleteDialog.value = false;
}

async function confirmAccountDelete() {
  if (accountDeleting.value) return;
  accountDeleting.value = true;
  accountDeleteError.value = '';
  try {
    await uiStore.deleteAccount();
    uiStore.notify(t('settings.deleteAccountSuccess'), 'success');
    await router.replace('/');
  } catch {
    accountDeleteError.value = t('settings.deleteAccountFailed');
  } finally {
    accountDeleting.value = false;
  }
}
</script>

<template>
  <AppLayout :title="t('settings.title')" back :back-to="utilityBackTarget" back-replace>
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
          <button
            v-if="uiStore.currentUser"
            type="button"
            class="settings-action-row settings-action-row--delete-account"
            @click="openAccountDeleteDialog"
          >
            <span>{{ t('settings.deleteAccount') }}</span>
            <em aria-hidden="true">›</em>
          </button>
          <RouterLink v-else class="settings-action-row" to="/login">
            <span>{{ t('settings.login') }}</span>
            <em aria-hidden="true">›</em>
          </RouterLink>
        </div>
      </div>
    </section>

    <div v-if="showAccountDeleteDialog" class="account-delete-backdrop" @click.self="closeAccountDeleteDialog">
      <section class="account-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="account-delete-title">
        <h2 id="account-delete-title">{{ t('settings.deleteAccount') }}</h2>
        <p>{{ t('settings.deleteAccountWarning') }}</p>
        <p>{{ t('settings.deleteAccountDescription') }}</p>
        <p v-if="accountDeleteError" class="account-delete-error" role="alert">{{ accountDeleteError }}</p>
        <div class="account-delete-actions">
          <button type="button" :disabled="accountDeleting" @click="closeAccountDeleteDialog">{{ t('common.cancel') }}</button>
          <button type="button" :disabled="accountDeleting" class="account-delete-confirm" @click="confirmAccountDelete">
            {{ accountDeleting ? t('common.loading') : t('settings.deleteAccountConfirm') }}
          </button>
        </div>
      </section>
    </div>
  </AppLayout>
</template>

<style scoped>
.account-delete-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.46);
}

.account-delete-dialog {
  width: min(100%, 360px);
  padding: 24px;
  border-radius: 18px;
  background: var(--surface, #fff);
  box-shadow: 0 20px 48px rgba(15, 23, 42, 0.24);
}

.account-delete-dialog h2,
.account-delete-dialog p { margin: 0; }
.account-delete-dialog h2 { font-size: 18px; }
.account-delete-dialog p { margin-top: 10px; color: var(--muted); line-height: 1.5; }
.account-delete-error { color: var(--color-semantic-down, #cf202f) !important; }

.account-delete-actions { display: flex; gap: 8px; margin-top: 22px; }
.account-delete-actions button { flex: 1; min-height: 42px; border-radius: 10px; font: inherit; font-weight: 750; }
.account-delete-actions button:not(.account-delete-confirm) {
  color: var(--muted);
  border-color: var(--border-strong);
  background: var(--color-secondary);
}
.account-delete-confirm {
  color: var(--color-on-primary, #fff);
  border-color: var(--color-primary);
  background: var(--color-primary);
}
</style>
