<script setup>
import { onMounted } from 'vue';
import { RouterView } from 'vue-router';
import { useUiStore } from './stores/uiStore.js';

const uiStore = useUiStore();

onMounted(() => {
  uiStore.restore();
});
</script>

<template>
  <RouterView />

  <div v-if="uiStore.loginRequiredMessage" class="sheet-backdrop" @click="uiStore.loginRequiredMessage = ''">
    <section class="bottom-sheet" @click.stop>
      <div class="sheet-handle"></div>
      <h2>로그인이 필요해요</h2>
      <p>{{ uiStore.loginRequiredMessage }}</p>
      <RouterLink class="button button-primary" to="/login" @click="uiStore.loginRequiredMessage = ''">
        로그인하기
      </RouterLink>
      <button class="button button-ghost" type="button" @click="uiStore.loginRequiredMessage = ''">
        나중에
      </button>
    </section>
  </div>

  <div v-if="uiStore.toast" class="toast-message">
    {{ uiStore.toast }}
  </div>
</template>
