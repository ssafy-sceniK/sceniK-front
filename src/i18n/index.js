import { createI18n } from 'vue-i18n';
import ko from './locales/ko.json';
import en from './locales/en.json';
import ja from './locales/ja.json';
import zhCN from './locales/zh-CN.json';
import { normalizeLocale, resolveInitialLocale, writeStoredLocale } from './languages.js';

export { languageOptions, normalizeLocale, supportedLocales } from './languages.js';

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: resolveInitialLocale(),
  fallbackLocale: 'ko',
  messages: {
    ko,
    en,
    ja,
    'zh-CN': zhCN,
  },
});

writeStoredLocale(i18n.global.locale.value);

export function setLocale(locale) {
  const normalized = normalizeLocale(locale) || 'ko';
  i18n.global.locale.value = normalized;
  return writeStoredLocale(normalized);
}

export function getCurrentLocale() {
  return normalizeLocale(i18n.global.locale.value) || 'ko';
}
