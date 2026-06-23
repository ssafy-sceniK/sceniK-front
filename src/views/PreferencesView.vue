<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useUiStore } from '../stores/uiStore.js';
import AppLayout from '../components/layout/AppLayout.vue';
import BaseButton from '../components/common/BaseButton.vue';
import { localizePreferenceOption } from '../i18n/systemContent.js';
import { PREFERENCE_CONTENT_TYPES, PREFERENCE_REGIONS, PREFERENCE_THEMES, normalizePreferenceSelection } from '../utils/preferences.js';

const router = useRouter();
const uiStore = useUiStore();
const { t, locale } = useI18n();
const types = PREFERENCE_CONTENT_TYPES;
const regions = PREFERENCE_REGIONS;
const themes = PREFERENCE_THEMES;
const selectedTypes = ref([]);
const selectedRegions = ref([]);
const selectedThemes = ref([]);
const canComplete = computed(() => selectedTypes.value.length > 0 && selectedRegions.value.length > 0 && selectedThemes.value.length > 0);

onMounted(() => {
  const preferences = normalizePreferenceSelection(uiStore.currentUser?.preferences);
  selectedTypes.value = [...preferences.contentTypes];
  selectedRegions.value = [...preferences.regions];
  selectedThemes.value = [...preferences.themes];
});

function optionLabel(group, item) {
  return localizePreferenceOption(group, item, t, locale.value);
}

function toggle(list, item) {
  const index = list.indexOf(item);
  if (index >= 0) list.splice(index, 1);
  else list.push(item);
}

async function complete() {
  if (!canComplete.value) {
    uiStore.notify(t('preferences.validation.requiredAll'));
    return;
  }
  await uiStore.savePreferences({
    contentTypes: selectedTypes.value,
    regions: selectedRegions.value,
    themes: selectedThemes.value,
  });
  router.push(routeRedirectPath());
}

function routeRedirectPath() {
  return router.currentRoute.value.query.redirect?.toString() || '/home';
}
</script>

<template>
  <AppLayout :title="t('preferences.title')" hide-bottom>
    <section class="preference-screen">
      <div class="page-intro preference-intro">
        <h1>{{ t('preferences.heading') }}</h1>
        <p>{{ t('preferences.subtitle') }}</p>
      </div>

      <div class="preference-block">
        <h2>{{ t('preferences.groups.contentTypes') }}</h2>
        <div class="chip-row wrap">
          <button
            v-for="item in types"
            :key="item"
            type="button"
            class="chip"
            :class="{ selected: selectedTypes.includes(item) }"
            :aria-pressed="selectedTypes.includes(item)"
            @click="toggle(selectedTypes, item)"
          >
            {{ optionLabel('contentTypes', item) }}
          </button>
        </div>
      </div>

      <div class="preference-block">
        <h2>{{ t('preferences.groups.regions') }}</h2>
        <div class="chip-row wrap">
          <button
            v-for="item in regions"
            :key="item"
            type="button"
            class="chip"
            :class="{ selected: selectedRegions.includes(item) }"
            :aria-pressed="selectedRegions.includes(item)"
            @click="toggle(selectedRegions, item)"
          >
            {{ optionLabel('regions', item) }}
          </button>
        </div>
      </div>

      <div class="preference-block">
        <h2>{{ t('preferences.groups.themes') }}</h2>
        <div class="chip-row wrap">
          <button
            v-for="item in themes"
            :key="item"
            type="button"
            class="chip"
            :class="{ selected: selectedThemes.includes(item) }"
            :aria-pressed="selectedThemes.includes(item)"
            @click="toggle(selectedThemes, item)"
          >
            {{ optionLabel('themes', item) }}
          </button>
        </div>
      </div>

      <div class="sticky-actions">
        <BaseButton block :disabled="!canComplete" @click="complete">{{ t('preferences.saveAndStart') }}</BaseButton>
      </div>
    </section>
  </AppLayout>
</template>
