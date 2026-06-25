<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { translateResource } from '../../api/translationApi.js';
import { detectTextLanguage } from '../../i18n/languageDetection.js';
import { normalizeLocale } from '../../i18n/languages.js';

const props = defineProps({
  title: { type: String, default: '' },
  content: { type: String, default: '' },
  sourceLanguage: { type: String, default: '' },
  resourceType: { type: String, default: 'POST' },
  resourceId: { type: [String, Number], default: '' },
});

const { t, locale } = useI18n();
const loading = ref(false);
const error = ref('');
const translatedTitle = ref('');
const translatedContent = ref('');
const showingTranslation = ref(false);

const sourceText = computed(() => [props.title, props.content].filter(Boolean).join('\n'));
const sourceLocale = computed(() => normalizeLocale(props.sourceLanguage) || detectTextLanguage(sourceText.value, 'unknown'));
const targetLocale = computed(() => normalizeLocale(locale.value) || 'ko');
const canTranslate = computed(() => Boolean(
  sourceText.value
  && props.resourceType
  && props.resourceId !== ''
  && sourceLocale.value !== 'unknown'
  && sourceLocale.value !== targetLocale.value,
));
const displayTitle = computed(() => (showingTranslation.value && translatedTitle.value ? translatedTitle.value : props.title));
const displayContent = computed(() => (showingTranslation.value && translatedContent.value ? translatedContent.value : props.content));

watch(() => [props.title, props.content, props.resourceId, targetLocale.value], () => {
  loading.value = false;
  error.value = '';
  translatedTitle.value = '';
  translatedContent.value = '';
  showingTranslation.value = false;
});

async function translateField(field, fallback) {
  if (!fallback) return '';
  const result = await translateResource({
    resourceType: props.resourceType,
    resourceId: String(props.resourceId),
    field,
    targetLanguage: targetLocale.value,
  });
  return result?.translatedText || fallback;
}

async function toggleTranslation() {
  if (showingTranslation.value) {
    showingTranslation.value = false;
    return;
  }
  if (translatedTitle.value || translatedContent.value) {
    showingTranslation.value = true;
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    const [titleResult, contentResult] = await Promise.allSettled([
      translateField('title', props.title),
      translateField('content', props.content),
    ]);
    translatedTitle.value = titleResult.status === 'fulfilled' ? titleResult.value : props.title;
    translatedContent.value = contentResult.status === 'fulfilled' ? contentResult.value : props.content;
    if (titleResult.status === 'rejected' && contentResult.status === 'rejected') {
      throw new Error('translation failed');
    }
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
  <div class="translatable-post-text">
    <h1>{{ displayTitle }}</h1>
    <p class="translatable-text">
      <span>{{ displayContent }}</span>
      <span v-if="canTranslate" class="translation-control-row">
        <button type="button" class="translation-toggle" :class="{ 'is-active': showingTranslation }" :aria-pressed="showingTranslation" :disabled="loading" @click="toggleTranslation">
          {{ loading ? t('translation.loading') : showingTranslation ? t('translation.original') : t('translation.show') }}
        </button>
        <small v-if="error" class="translation-error">{{ error }}</small>
      </span>
    </p>
  </div>
</template>
