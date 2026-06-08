<script setup>
defineProps({
  title: { type: String, required: true },
  to: { type: String, default: '' },
});
</script>

<template>
  <div class="section-header">
    <h2>{{ title }}</h2>
    <RouterLink v-if="to" :to="to">전체보기</RouterLink>
  </div>
</template>
