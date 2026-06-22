<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUiStore } from '../stores/uiStore.js';
import AppLayout from '../components/layout/AppLayout.vue';
import BaseButton from '../components/common/BaseButton.vue';
import { PREFERENCE_CONTENT_TYPES, PREFERENCE_REGIONS, PREFERENCE_THEMES, normalizePreferenceSelection } from '../utils/preferences.js';

const router = useRouter();
const uiStore = useUiStore();
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

function toggle(list, item) {
  const index = list.indexOf(item);
  if (index >= 0) list.splice(index, 1);
  else list.push(item);
}

async function complete() {
  if (!canComplete.value) {
    uiStore.notify('콘텐츠 유형, 선호 지역, 선호 테마를 각각 1개 이상 선택해 주세요.');
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
  <AppLayout title="취향 선택" hide-bottom>
    <section class="preference-screen">
      <div class="page-intro preference-intro">
        <h1>좋아하는 K-콘텐츠를 선택해주세요</h1>
        <p>AI 맞춤 추천에 활용돼요. 복수 선택할 수 있습니다.</p>
      </div>

      <div class="preference-block">
        <h2>콘텐츠 유형</h2>
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
            {{ item }}
          </button>
        </div>
      </div>

      <div class="preference-block">
        <h2>선호 지역</h2>
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
            {{ item }}
          </button>
        </div>
      </div>

      <div class="preference-block">
        <h2>선호 테마</h2>
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
            {{ item }}
          </button>
        </div>
      </div>

      <div class="sticky-actions">
        <BaseButton block :disabled="!canComplete" @click="complete">취향 저장하고 시작하기</BaseButton>
      </div>
    </section>
  </AppLayout>
</template>
