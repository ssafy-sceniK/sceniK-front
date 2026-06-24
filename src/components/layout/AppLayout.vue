<script setup>
import TopNav from './TopNav.vue';
import BottomNav from './BottomNav.vue';

defineProps({
  title: { type: String, default: '' },
  back: { type: Boolean, default: false },
  backTo: { type: String, default: '' },
  hideBottom: { type: Boolean, default: false },
});
</script>

<template>
  <main class="app-shell">
    <TopNav :title="title" :back="back" :back-to="backTo">
      <template v-if="$slots.actions" #actions>
        <slot name="actions" />
      </template>
    </TopNav>
    <section class="screen-content" :class="{ 'without-bottom': hideBottom }">
      <slot />
    </section>
    <BottomNav v-if="!hideBottom" />
  </main>
</template>
