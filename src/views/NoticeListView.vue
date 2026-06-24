<script setup>
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import EmptyState from '../components/common/EmptyState.vue';
import { findNotice, localizedNotices, noticeRouteId } from '../data/notices.js';

const { t } = useI18n();

const route = useRoute();
const router = useRouter();
const noticeItems = computed(() => localizedNotices(t));
const selectedNotice = computed(() => {
  const notice = findNotice(route.params.noticeId ?? route.params.id);
  return notice ? {
    ...notice,
    title: t(notice.titleKey),
    body: t(notice.bodyKey),
  } : null;
});
const isDetail = computed(() => route.name === 'notice-detail');

function goBackToList() {
  router.push({ name: 'notice' });
}
</script>

<template>
  <AppLayout :title="t('notice.title')" back :back-to="isDetail ? '/notice' : '/home'">
    <section v-if="!isDetail" class="list-screen notice-screen">
      <RouterLink v-for="notice in noticeItems" :key="notice.id" :to="`/notice/${noticeRouteId(notice.id)}`" class="notice-row">
        <span>{{ notice.title }}</span>
        <small>{{ notice.date }}</small>
      </RouterLink>
    </section>

    <section v-else class="list-screen notice-screen notice-detail-screen">
      <article v-if="selectedNotice" class="panel-card notice-detail-card">
        <small>{{ selectedNotice.date }}</small>
        <h2>{{ selectedNotice.title }}</h2>
        <p>{{ selectedNotice.body }}</p>
      </article>
      <EmptyState
        v-else
        icon="!"
        tone="error"
        compact
        :title="t('notice.notFound')"
        :text="t('notice.notFoundText')"
        :action-label="t('notice.backToList')"
        @action="goBackToList"
      />
    </section>
  </AppLayout>
</template>
