<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUiStore } from '../stores/uiStore.js';
import AppLayout from '../components/layout/AppLayout.vue';
import BaseButton from '../components/common/BaseButton.vue';

const router = useRouter();
const uiStore = useUiStore();
const types = ['드라마', '영화', '아이돌', '예능', '배우'];
const regions = ['서울', '부산', '제주', '경기', '강원', '인천'];
const themes = ['감성 여행', '맛집 중심', '촬영지 중심', '성지순례'];
const selectedTypes = ref(['드라마']);
const selectedRegions = ref(['서울']);
const selectedThemes = ref(['감성 여행']);

function toggle(list, item) {
  const index = list.value.indexOf(item);
  if (index >= 0) list.value.splice(index, 1);
  else list.value.push(item);
}

async function complete() {
  await uiStore.savePreferences({
    contentTypes: selectedTypes.value,
    regions: selectedRegions.value,
    themes: selectedThemes.value,
  });
  router.push('/home');
}
</script>

<template>
  <AppLayout title="취향 선택" hide-bottom>
    <section class="preference-screen">
      <div class="page-intro">
        <h1>좋아하는 K-콘텐츠를 선택해주세요</h1>
        <p>AI 맞춤 추천에 활용돼요. 복수 선택할 수 있습니다.</p>
      </div>

      <div class="preference-block">
        <h2>콘텐츠 유형</h2>
        <div class="chip-row wrap">
          <button v-for="item in types" :key="item" class="chip" :class="{ selected: selectedTypes.includes(item) }" @click="toggle(selectedTypes, item)">
            {{ item }}
          </button>
        </div>
      </div>

      <div class="preference-block">
        <h2>선호 지역</h2>
        <div class="chip-row wrap">
          <button v-for="item in regions" :key="item" class="chip" :class="{ selected: selectedRegions.includes(item) }" @click="toggle(selectedRegions, item)">
            {{ item }}
          </button>
        </div>
      </div>

      <div class="preference-block">
        <h2>선호 테마</h2>
        <div class="chip-row wrap">
          <button v-for="item in themes" :key="item" class="chip" :class="{ selected: selectedThemes.includes(item) }" @click="toggle(selectedThemes, item)">
            {{ item }}
          </button>
        </div>
      </div>

      <div class="sticky-actions">
        <BaseButton block @click="complete">완료 - 시작하기</BaseButton>
        <BaseButton variant="ghost" block @click="router.push('/home')">나중에 설정할게요</BaseButton>
      </div>
    </section>
  </AppLayout>
</template>
