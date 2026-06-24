<script setup>
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import { notices } from '../data/mockData.js';

const { t } = useI18n();

const route = useRoute();
const selectedNotice = computed(() => notices.find((item) => item.id === route.params.id));
</script>

<template>
  <AppLayout :title="t('notice.cleanup.kd594d485f9')" back>
    <section class="list-screen notice-screen">
      <RouterLink v-for="notice in notices" :key="notice.id" :to="`/notice/${notice.id}`" class="notice-row">
        <span>{{ notice.title }}</span>
        <small>{{ notice.date }}</small>
      </RouterLink>
      <article v-if="selectedNotice" class="panel-card notice-detail-card">
        <small>{{ selectedNotice.date }}</small>
        <h2>{{ selectedNotice.title }}</h2>
        <p>{{ t('notice.cleanup.k4bf64c7200') }}</p>
      </article>
    </section>
  </AppLayout>
</template>
