<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

const route = useRoute();
const { t } = useI18n();
const tabs = [
  { id: 'ai', labelKey: 'nav.ai', to: '/ai', match: ['/ai'], icon: ['M12 2.8l1.7 5.1 5.2 1.7-5.2 1.7-1.7 5.1-1.7-5.1-5.2-1.7 5.2-1.7L12 2.8z', 'M18.8 15.2l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z'] },
  { id: 'explore', labelKey: 'nav.explore', to: '/explore', match: ['/explore', '/contents', '/places', '/search'], icon: ['M10.8 18.1a7.3 7.3 0 1 1 0-14.6 7.3 7.3 0 0 1 0 14.6z', 'M16.2 16.2 21 21'] },
  { id: 'home', labelKey: 'nav.home', to: '/home', match: ['/home', '/notice'], icon: ['M3.8 10.7 12 4l8.2 6.7v8.8a1.5 1.5 0 0 1-1.5 1.5H5.3a1.5 1.5 0 0 1-1.5-1.5v-8.8z', 'M9 21v-6h6v6'] },
  { id: 'community', labelKey: 'nav.community', to: '/community', match: ['/community'], icon: ['M20 14a5 5 0 0 1-5 5H8l-4 3v-3a5 5 0 0 1-2-4V8a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v6z'] },
  { id: 'my', labelKey: 'nav.my', to: '/my', match: ['/my'], icon: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M4.5 21a7.5 7.5 0 0 1 15 0'] },
];

const activeId = computed(() => tabs.find((tab) => tab.match.some((prefix) => route.path.startsWith(prefix)))?.id ?? 'home');
</script>

<template>
  <nav class="bottom-nav" :aria-label="t('nav.home')">
    <RouterLink
      v-for="tab in tabs"
      :key="tab.id"
      class="bottom-tab"
      :class="{ active: activeId === tab.id, primary: tab.id === 'ai' }"
      :to="tab.to"
    >
      <svg class="tab-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path v-for="path in tab.icon" :key="path" :d="path" />
      </svg>
      <span>{{ t(tab.labelKey) }}</span>
    </RouterLink>
  </nav>
</template>