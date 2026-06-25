<script setup>
import { computed } from 'vue';

defineOptions({
  name: 'CommunityBoardIcon',
});

const props = defineProps({
  type: { type: String, default: 'drama' },
});

const iconType = computed(() => {
  const value = String(props.type || '').toLowerCase();
  return ['drama', 'movie', 'idol', 'variety', 'region'].includes(value) ? value : 'drama';
});
</script>

<template>
  <svg class="community-board-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <g v-if="iconType === 'drama'">
      <rect x="4" y="7" width="13" height="10" rx="2.2" />
      <path d="M17 10.2 21 8v8l-4-2.2" />
      <path d="M8.2 7 9.4 4.8h4.1L14.8 7" />
      <circle cx="10.5" cy="12" r="2.2" />
    </g>
    <g v-else-if="iconType === 'movie'">
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M8 5v14M16 5v14" />
      <path d="M11 10.2 14.4 12 11 13.8v-3.6Z" fill="currentColor" stroke="none" />
      <path d="M6 8h.01M6 12h.01M6 16h.01M18 8h.01M18 12h.01M18 16h.01" />
    </g>
    <g v-else-if="iconType === 'idol'">
      <path d="m12 4 1.85 4.18 4.55.48-3.38 3.08.96 4.46L12 13.9 8.02 16.2l.96-4.46L5.6 8.66l4.55-.48L12 4Z" />
    </g>
    <g v-else-if="iconType === 'variety'">
      <rect x="4" y="7" width="16" height="11" rx="2.2" />
      <path d="m10.5 10.3 4 2.2-4 2.2v-4.4Z" fill="currentColor" stroke="none" />
      <path d="M9 4.5 12 7l3-2.5" />
      <path d="M8 20h8" />
    </g>
    <g v-else>
      <path d="M12 21s6-5.2 6-10.2A6 6 0 0 0 6 10.8C6 15.8 12 21 12 21Z" />
      <circle cx="12" cy="10.8" r="2.1" />
      <path d="M8.5 17.8h7" />
    </g>
  </svg>
</template>
