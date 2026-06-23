import { normalizeLocale } from './languages.js';

export function detectTextLanguage(text, fallback = 'unknown') {
  const value = String(text ?? '');
  if (!value.trim()) return normalizeLocale(fallback) || 'unknown';
  const counts = {
    ko: 0,
    ja: 0,
    'zh-CN': 0,
    en: 0,
  };
  for (const char of value) {
    const code = char.codePointAt(0);
    if (code >= 0xac00 && code <= 0xd7af) counts.ko += 1;
    else if ((code >= 0x3040 && code <= 0x30ff) || (code >= 0x31f0 && code <= 0x31ff)) counts.ja += 1;
    else if (code >= 0x4e00 && code <= 0x9fff) counts['zh-CN'] += 1;
    else if ((code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a)) counts.en += 1;
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (sorted[0][1] === 0) return normalizeLocale(fallback) || 'unknown';
  if (sorted[0][1] === sorted[1][1]) return normalizeLocale(fallback) || sorted[0][0];
  return sorted[0][0];
}
