<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useUiStore } from '../stores/uiStore.js';
import AppLayout from '../components/layout/AppLayout.vue';
import PlaceCard from '../components/place/PlaceCard.vue';
import EmptyState from '../components/common/EmptyState.vue';
import ProfileAvatar from '../components/common/ProfileAvatar.vue';

const router = useRouter();
const uiStore = useUiStore();
const { t } = useI18n();
const activeTab = ref('activity');

onMounted(async () => {
  if (!uiStore.currentUser) return;
  await Promise.all([
    uiStore.loadSavedCourses(),
    uiStore.loadEngagementState(),
    uiStore.loadCommunityPosts(),
    uiStore.loadMyReviews(),
    uiStore.loadFollowState(),
  ]);
});

function ownsPost(post) {
  if (!uiStore.currentUser) return false;
  return post.userId ? post.userId === uiStore.currentUser.userId : post.user === uiStore.currentUser.nickname;
}

function hasUserComment(post) {
  if (!uiStore.currentUser) return false;
  return (post.comments ?? []).some((comment) => (
    comment.userId ? comment.userId === uiStore.currentUser.userId : comment.user === uiStore.currentUser.nickname
  ));
}

const myPosts = computed(() => uiStore.communityPosts.filter(ownsPost));
const commentedPosts = computed(() => uiStore.currentUser
  ? uiStore.communityPosts.filter(hasUserComment)
  : []);
const scrappedPosts = computed(() => uiStore.currentUser
  ? uiStore.communityPosts.filter((post) => (post.scrappedBy ?? []).includes(uiStore.currentUser.userId))
  : []);
const profileInitial = computed(() => uiStore.currentUser?.nickname?.slice(0, 1).toUpperCase() ?? 'K');
const profileBio = computed(() => uiStore.currentUser?.bio || t('my.profile.defaultBio'));
const profileImageUrl = computed(() => uiStore.currentUser?.profileImageUrl ?? '');
const profilePreferenceChips = computed(() => {
  const preferences = uiStore.currentUser?.preferences;
  if (!preferences) return [];
  if (Array.isArray(preferences)) return preferences.filter(Boolean).slice(0, 6);
  return Object.values(preferences)
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .filter(Boolean)
    .slice(0, 6);
});
const plannedCount = computed(() => uiStore.plannedVisitItems.length);
const completedCount = computed(() => uiStore.completedVisitItems.length);
const totalVisitCount = computed(() => plannedCount.value + completedCount.value);
const visitProgress = computed(() => totalVisitCount.value ? Math.round((completedCount.value / totalVisitCount.value) * 100) : 0);
const myReviewCount = computed(() => uiStore.myReviews.length);
const tabs = computed(() => [
  {
    id: 'activity',
    label: t('my.tabs.activity'),
  },
  {
    id: 'visits',
    label: t('my.tabs.visits'),
  },
  {
    id: 'posts',
    label: t('my.tabs.posts'),
  },
]);

async function logoutToLanding() {
  await uiStore.logout();
  router.replace('/');
}
</script>

<template>
  <AppLayout>
    <section v-if="!uiStore.currentUser" class="my-login">
      <div class="profile-card guest">
        <span class="badge ai">My Page</span>
        <h1>{{ t('my.guest.heading') }}</h1>
        <p>{{ t('my.guest.subtitle') }}</p>
        <RouterLink class="button button-primary my-login-button" to="/login">{{ t('my.guest.loginSignup') }}</RouterLink>
      </div>
    </section>

    <section v-else class="my-page">
      <div class="profile-card my-profile-card">
        <ProfileAvatar
          :image-url="profileImageUrl"
          :initial="profileInitial"
          :alt="t('my.profile.avatarAlt')"
          interactive
          :aria-label="t('my.profile.edit')"
          @click="router.push('/my/profile-edit')"
        />
        <div class="profile-copy">
          <div class="profile-name-row">
            <h1>{{ uiStore.currentUser.nickname }}</h1>
          </div>
          <p>{{ profileBio }}</p>
          <small class="profile-meta">{{ uiStore.currentUser.email }}</small>
          <div v-if="profilePreferenceChips.length" class="profile-preference-chips" :aria-label="t('my.profile.preferencesAria')">
            <span v-for="item in profilePreferenceChips" :key="item">{{ item }}</span>
          </div>
        </div>
        <div class="profile-actions">
          <RouterLink class="profile-edit-button" to="/my/profile-edit">{{ t('my.profile.edit') }}</RouterLink>
          <button type="button" class="profile-edit-button profile-logout" @click="logoutToLanding">{{ t('settings.logout') }}</button>
        </div>
      </div>

      <div class="stats-grid">
        <button type="button" @click="router.push('/my/activity/saved-routes')">
          <b>{{ uiStore.savedCourses.length }}</b><span>{{ t('my.stats.courses') }}</span>
        </button>
        <button type="button" @click="router.push('/my/posts')">
          <b>{{ myPosts.length }}</b><span>{{ t('my.stats.posts') }}</span>
        </button>
        <button type="button" @click="router.push('/my/visit-completed')">
          <b>{{ completedCount }}</b><span>{{ t('my.stats.completedVisits') }}</span>
        </button>
        <button type="button" @click="router.push('/my/activity/reviews')">
          <b>{{ myReviewCount }}</b><span>{{ t('my.stats.reviews') }}</span>
        </button>
      </div>

      <div class="my-section-tabs" aria-label="My Page sections">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <strong>{{ tab.label }}</strong>
        </button>
      </div>

      <div v-if="activeTab === 'activity'" class="my-section-panel">
        <div class="my-menu-list">
          <RouterLink class="my-menu-row" to="/my/activity/liked-content">
            <span class="my-menu-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M12 20.5 5.4 14A4.6 4.6 0 0 1 12 7.5 4.6 4.6 0 0 1 18.6 14L12 20.5Z" /></svg>
            </span>
            <span><strong>{{ t('my.menu.likedContent') }}</strong><small>{{ t('my.counts.content', { count: uiStore.likedContentItems.length }) }}</small></span>
            <em>›</em>
          </RouterLink>
          <RouterLink class="my-menu-row" to="/my/activity/liked-places">
            <span class="my-menu-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M12 21s7-5.4 7-11.2A7 7 0 0 0 5 9.8C5 15.6 12 21 12 21Z" /><circle cx="12" cy="9.8" r="2.3" /></svg>
            </span>
            <span><strong>{{ t('my.menu.likedPlaces') }}</strong><small>{{ t('my.counts.places', { count: uiStore.likedPlaceItems.length }) }}</small></span>
            <em>›</em>
          </RouterLink>
          <RouterLink class="my-menu-row" to="/my/activity/saved-routes">
            <span class="my-menu-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M6 4.5h12v15l-6-3.4-6 3.4v-15Z" /><path d="M9 9h6" /><path d="M9 12h4" /></svg>
            </span>
            <span><strong>{{ t('my.menu.savedCourses') }}</strong><small>{{ t('my.counts.courses', { count: uiStore.savedCourses.length }) }}</small></span>
            <em>›</em>
          </RouterLink>
          <RouterLink class="my-menu-row" to="/my/activity/reviews">
            <span class="my-menu-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M5 5h14v10H8l-3 3V5Z" /><path d="M8 9h8" /><path d="M8 12h5" /></svg>
            </span>
            <span><strong>{{ t('my.menu.myReviews') }}</strong><small>{{ t('my.counts.reviews', { count: myReviewCount }) }}</small></span>
            <em>›</em>
          </RouterLink>
          <RouterLink class="my-menu-row" to="/my/following">
            <span class="my-menu-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" /><path d="M2.5 20a5.5 5.5 0 0 1 11 0" /><path d="M16 8h5" /><path d="M18.5 5.5v5" /></svg>
            </span>
            <span><strong>{{ t('my.menu.following') }}</strong><small>{{ t('my.counts.users', { count: uiStore.followingUsers.length }) }}</small></span>
            <em>›</em>
          </RouterLink>
          <RouterLink class="my-menu-row" to="/my/followers">
            <span class="my-menu-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><circle cx="8.5" cy="7.8" r="3.4" /><path d="M3.2 20.2v-1.1c0-3.5 2.4-6 5.3-6s5.3 2.5 5.3 6v1.1H3.2Z" /><circle cx="17.4" cy="8.5" r="2.8" /><path d="M14.9 14.2c.7-.4 1.5-.6 2.5-.6 2.5 0 4.5 2.1 4.5 4.9v1.7h-5.7" /></svg>
            </span>
            <span><strong>{{ t('my.menu.followers') }}</strong><small>{{ t('my.counts.users', { count: uiStore.followerUsers.length }) }}</small></span>
            <em>›</em>
          </RouterLink>
        </div>
      </div>

      <div v-else-if="activeTab === 'visits'" class="my-section-panel stack-list">
        <div class="visit-control-row">
          <RouterLink to="/my/visit-planned">{{ t('my.visits.planned') }}</RouterLink>
          <RouterLink to="/my/visit-completed">{{ t('my.visits.completed') }}</RouterLink>
        </div>

        <div class="visit-progress-card" :style="{ '--visit-progress': `${visitProgress}%` }">
          <strong>총 {{ totalVisitCount }}곳 중 {{ t('my.counts.places', { count: completedCount }) }} {{ t('my.visits.completed') }}</strong>
          <b><span></span></b>
          <small>{{ t('my.visits.progressPercent', { percent: visitProgress }) }}</small>
        </div>

        <div class="section-mini-header">
          <h2>{{ t('my.visits.planned') }}</h2>
          <span>{{ t('my.counts.places', { count: plannedCount }) }}</span>
        </div>
        <RouterLink v-for="place in uiStore.plannedVisitItems" :key="`planned-${place.placeId}`" :to="`/places/${place.placeId}`">
          <PlaceCard :place="place" compact />
        </RouterLink>

        <div class="section-mini-header with-divider">
          <h2>{{ t('my.visits.completed') }}</h2>
          <span>{{ t('my.counts.places', { count: completedCount }) }}</span>
        </div>
        <RouterLink v-for="place in uiStore.completedVisitItems" :key="`completed-${place.placeId}`" :to="`/places/${place.placeId}`">
          <PlaceCard :place="place" compact />
        </RouterLink>
        <EmptyState
          v-if="!totalVisitCount"
          icon="GO"
          tone="route"
          compact
          title="{{ t('my.visits.emptyTitle') }}"
          text="장소 상세에서 {{ t('my.visits.planned') }}이나 {{ t('my.visits.completed') }}를 눌러 여행 기록을 시작해보세요."
          action-label="{{ t('place.list.title') }}"
          action-to="/explore/map"
        />
      </div>

      <div v-else class="my-section-panel">
        <div class="my-menu-list">
          <RouterLink class="my-menu-row" to="/my/posts">
            <span class="my-menu-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" /><path d="m14 7 3 3" /></svg>
            </span>
            <span><strong>{{ t('my.menu.myPosts') }}</strong><small>{{ t('my.counts.posts', { count: myPosts.length }) }}</small></span>
            <em>›</em>
          </RouterLink>
          <RouterLink class="my-menu-row" to="/my/comments">
            <span class="my-menu-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M5 5.5h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H10l-5 3v-3H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z" /></svg>
            </span>
            <span><strong>{{ t('my.menu.commentedPosts') }}</strong><small>{{ t('my.counts.posts', { count: commentedPosts.length }) }}</small></span>
            <em>›</em>
          </RouterLink>
          <RouterLink class="my-menu-row" to="/my/scraps">
            <span class="my-menu-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M6 4.5h12v16l-6-3.6-6 3.6v-16Z" /></svg>
            </span>
            <span><strong>{{ t('my.menu.scraps') }}</strong><small>{{ t('my.counts.scraps', { count: scrappedPosts.length }) }}</small></span>
            <em>›</em>
          </RouterLink>
        </div>
      </div>
    </section>
  </AppLayout>
</template>
