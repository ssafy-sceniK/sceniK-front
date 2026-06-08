<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUiStore } from '../stores/uiStore.js';
import BaseButton from '../components/common/BaseButton.vue';
import BrandLogo from '../components/brand/BrandLogo.vue';

const router = useRouter();
const uiStore = useUiStore();
const nextPath = computed(() => uiStore.onboardingSeen ? '/home' : '/login');
</script>

<template>
  <main class="splash-screen">
    <section class="splash-mark">
      <BrandLogo size="splash" />
      <h1 class="sr-only">sceniK</h1>
      <p>좋아하는 K-콘텐츠 장면을 실제 한국 여행 코스로 이어보세요.</p>
    </section>
    <section class="splash-actions">
      <div class="step-dots"><b></b><i></i><i></i></div>
      <BaseButton block @click="router.push(nextPath)">시작하기</BaseButton>
      <BaseButton variant="ghost" block @click="router.push('/home')">둘러보기</BaseButton>
    </section>
  </main>
</template>
