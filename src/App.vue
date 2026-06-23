<script setup>
import { onMounted } from 'vue';
import { RouterView } from 'vue-router';
import { AnimatePresence, motion } from 'motion-v';
import { useUiStore } from './stores/uiStore.js';
import { motionVariants } from './utils/motion.js';

const uiStore = useUiStore();

onMounted(() => {
  uiStore.restore();
});
</script>

<template>
  <RouterView />

  <AnimatePresence>
    <motion.div v-if="uiStore.loginRequiredMessage" class="sheet-backdrop" v-bind="motionVariants.backdrop()" @click="uiStore.loginRequiredMessage = ''">
    <motion.section class="bottom-sheet" v-bind="motionVariants.bottomSheet()" @click.stop>
      <div class="sheet-handle"></div>
      <h2>로그인이 필요해요</h2>
      <p>{{ uiStore.loginRequiredMessage }}</p>
      <RouterLink class="button button-primary" to="/login" @click="uiStore.loginRequiredMessage = ''">
        로그인하기
      </RouterLink>
      <button class="button button-ghost" type="button" @click="uiStore.loginRequiredMessage = ''">
        나중에
      </button>
    </motion.section>
    </motion.div>
  </AnimatePresence>

  <AnimatePresence>
  <motion.div
    v-if="uiStore.toast"
    :class="['toast-message', `toast-message--${uiStore.toastTone || 'info'}`]"
    role="status"
    aria-live="polite"
    v-bind="motionVariants.toast()"
  >
    {{ uiStore.toast }}
  </motion.div>
  </AnimatePresence>
</template>
