export const LOCALE_STORAGE_KEY = 'scenik-locale';

export const supportedLocales = ['ko', 'en', 'ja', 'zh-CN'];

export const languageOptions = [
  { value: 'ko', labelKey: 'language.ko' },
  { value: 'en', labelKey: 'language.en' },
  { value: 'ja', labelKey: 'language.ja' },
  { value: 'zh-CN', labelKey: 'language.zh-CN' },
];

export function normalizeLocale(value) {
  const locale = String(value ?? '').trim();
  if (!locale) return '';
  const lower = locale.toLowerCase().replace('_', '-');
  if (lower.startsWith('ko')) return 'ko';
  if (lower.startsWith('en')) return 'en';
  if (lower.startsWith('ja')) return 'ja';
  if (lower === 'zh-cn' || lower.startsWith('zh-hans') || lower.startsWith('zh')) return 'zh-CN';
  return supportedLocales.includes(locale) ? locale : '';
}

export function readStoredLocale() {
  if (typeof localStorage === 'undefined') return '';
  return normalizeLocale(localStorage.getItem(LOCALE_STORAGE_KEY));
}

export function writeStoredLocale(locale) {
  const normalized = normalizeLocale(locale) || 'ko';
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(LOCALE_STORAGE_KEY, normalized);
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = normalized;
  }
  return normalized;
}

export function browserLocale() {
  if (typeof navigator === 'undefined') return '';
  return normalizeLocale(navigator.language || navigator.languages?.[0]);
}

export function resolveInitialLocale(profileLocale) {
  return normalizeLocale(profileLocale) || readStoredLocale() || browserLocale() || 'ko';
}
