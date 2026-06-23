<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { translateResource } from '../../api/translationApi.js';
import { detectTextLanguage } from '../../i18n/languageDetection.js';
import { normalizeLocale } from '../../i18n/languages.js';

const props = defineProps({
  text: { type: String, default: '' },
  sourceLanguage: { type: String, default: '' },
  resourceType: { type: String, default: '' },
  resourceId: { type: [String, Number], default: '' },
  field: { type: String, default: 'content' },
  tag: { type: String, default: 'p' },
});

const { t, locale } = useI18n();
const loading = ref(false);
const error = ref('');
const translatedText = ref('');
const showingTranslation = ref(false);
const cached = ref(false);

const sourceLocale = computed(() => normalizeLocale(props.sourceLanguage) || detectTextLanguage(props.text, 'unknown'));
const targetLocale = computed(() => normalizeLocale(locale.value) || 'ko');
const canTranslate = computed(() => Boolean(
  props.text
  && props.resourceType
  && props.resourceId !== ''
  && sourceLocale.value !== 'unknown'
  && sourceLocale.value !== targetLocale.value,
));
const displayText = computed(() => (showingTranslation.value && translatedText.value ? translatedText.value : props.text));

watch(() => [props.text, props.resourceId, targetLocale.value], () => {
  loading.value = false;
  error.value = '';
  translatedText.value = '';
  showingTranslation.value = false;
  cached.value = false;
});

async function toggleTranslation() {
  if (showingTranslation.value) {
    showingTranslation.value = false;
    return;
  }
  if (translatedText.value) {
    showingTranslation.value = true;
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    const result = await translateResource({
      resourceType: props.resourceType,
      resourceId: String(props.resourceId),
      field: props.field,
      targetLanguage: targetLocale.value,
    });
    translatedText.value = result?.translatedText || props.text;
    cached.value = Boolean(result?.cached);
    showingTranslation.value = true;
  } catch {
    error.value = t('translation.failed');
    showingTranslation.value = false;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <component :is="tag" class="translatable-text">
    <span>{{ displayText }}</span>
    <span v-if="canTranslate" class="translation-control-row">
      <button type="button" class="translation-toggle" :disabled="loading" @click="toggleTranslation">
        {{ loading ? t('translation.loading') : showingTranslation ? t('translation.original') : t('translation.show') }}
      </button>
      <small v-if="cached && showingTranslation">{{ t('translation.cached') }}</small>
      <small v-if="error" class="translation-error">{{ error }}</small>
    </span>
  </component>
</template>
