import { http } from './http.js';
import { unwrapApiData } from './error.js';

const TRANSLATION_TIMEOUT_MS = 20000;

function normalizeTranslationResponse(data) {
  const response = unwrapApiData(data) ?? data ?? {};
  if (typeof response === 'string') {
    return { translatedText: response };
  }

  return {
    ...response,
    translatedText: response.translatedText
      ?? response.translatedContent
      ?? response.translatedTitle
      ?? response.text
      ?? '',
  };
}

export async function translateResource(payload) {
  const { data } = await http.post('/translations', payload, { timeout: TRANSLATION_TIMEOUT_MS });
  return normalizeTranslationResponse(data);
}
