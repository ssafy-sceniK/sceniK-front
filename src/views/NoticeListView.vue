<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import { notices } from '../data/mockData.js';

const route = useRoute();
const selectedNotice = computed(() => notices.find((item) => item.id === route.params.id));
</script>

<template>
  <AppLayout title="공지사항" back>
    <section class="list-screen notice-screen">
      <RouterLink v-for="notice in notices" :key="notice.id" :to="`/notice/${notice.id}`" class="notice-row">
        <span>{{ notice.title }}</span>
        <small>{{ notice.date }}</small>
      </RouterLink>
      <article v-if="selectedNotice" class="panel-card notice-detail-card">
        <small>{{ selectedNotice.date }}</small>
        <h2>{{ selectedNotice.title }}</h2>
        <p>sceniK MVP에서 제공하는 안내입니다. 실제 서비스에서는 백엔드 공지 API로 교체됩니다.</p>
      </article>
    </section>
  </AppLayout>
</template>
