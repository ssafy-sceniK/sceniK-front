<script setup>
import { useI18n } from 'vue-i18n';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import EmptyState from '../components/common/EmptyState.vue';
import ProfileAvatar from '../components/common/ProfileAvatar.vue';
import CourseCard from '../components/course/CourseCard.vue';
import { fetchPublicProfile } from '../api/followApi.js';
import { getUserMessage } from '../api/error.js';
import { useUiStore } from '../stores/uiStore.js';

const { t } = useI18n();

const route = useRoute();
const router = useRouter();
const uiStore = useUiStore();
const profile = ref(null);
const loading = ref(false);
const error = ref('');
const activeTab = ref('courses');

const user = computed(() => profile.value?.user ?? null);
const isMe = computed(() => String(user.value?.userId ?? '') === String(uiStore.currentUser?.userId ?? ''));
const initial = computed(() => user.value?.nickname?.slice(0, 1).toUpperCase() || 'U');
const preferenceChips = computed(() => {
  const preferences = user.value?.preferences;
  if (!preferences) return [];
  return Object.values(preferences).flatMap((value) => Array.isArray(value) ? value : [value]).filter(Boolean).slice(0, 6);
});

async function loadProfile() {
  loading.value = true;
  error.value = '';
  try {
    profile.value = await fetchPublicProfile(route.params.userId);
  } catch (err) {
    error.value = getUserMessage(err, t('autoPass.ui_f0b70426f5'));
    profile.value = null;
  } finally {
    loading.value = false;
  }
}

async function toggleFollow() {
  if (!user.value || isMe.value) return;
  if (profile.value.followedByMe) await uiStore.unfollowUser(user.value.userId, user.value.nickname);
  else await uiStore.followUser(user.value.userId, user.value.nickname);
  await loadProfile();
}

function openCourse(course) {
  router.push({ name: 'course-detail', params: { routeId: course.routeId } });
}

onMounted(loadProfile);
watch(() => route.params.userId, loadProfile);
</script>

<template>
  <AppLayout :title="t('autoPass.ui_ffb4532570')" back>
    <section class="public-profile-screen">
      <EmptyState
        v-if="loading"
        tone="loading"
        compact
        :title="t('autoPass.ui_da249de8df')"
        :text="t('autoPass.ui_e733db214c')"
      />
      <EmptyState
        v-else-if="error"
        icon="!"
        tone="error"
        compact
        :title="t('autoPass.ui_554f9cc650')"
        :text="error"
        :action-label="t('autoPass.ui_dd06170722')"
        @action="loadProfile"
      />
      <template v-else-if="user">
        <section class="profile-card public-profile-card">
          <ProfileAvatar :image-url="user.profileImageUrl" :initial="initial" :alt="t('autoPass.ui_d4a0532b58')" />
          <div class="profile-copy">
            <div class="profile-name-row">
              <h1>{{ user.nickname }}</h1>
              <span>{{ t('autoPass.ui_bcaf3ba329', { count: profile.followerCount }) }}</span>
            </div>
            <p>{{ user.bio || t('autoPass.ui_dd4e92605a') }}</p>
            <small class="profile-meta">{{ t('autoPass.ui_1443036d4d', { count: profile.followingCount }) }}</small>
            <div v-if="preferenceChips.length" class="profile-preference-chips">
              <span v-for="item in preferenceChips" :key="item">{{ item }}</span>
            </div>
          </div>
          <div v-if="!isMe" class="profile-actions">
            <button type="button" class="profile-edit-button" @click="toggleFollow">
              {{ profile.followedByMe ? t('autoPass.ui_0aa8938154') : t('autoPass.ui_e0fa0960ec') }}
            </button>
          </div>
        </section>

        <div class="my-section-tabs public-profile-tabs" :aria-label="t('autoPass.ui_2dc06acea8')">
          <button type="button" :class="{ active: activeTab === 'courses' }" @click="activeTab = 'courses'">
            <strong>{{ t('autoPass.ui_d91f63e6be') }}</strong>
          </button>
          <button type="button" :class="{ active: activeTab === 'posts' }" @click="activeTab = 'posts'">
            <strong>{{ t('autoPass.ui_cb3c4036f4') }}</strong>
          </button>
        </div>

        <div v-if="activeTab === 'courses'" class="stack-list">
          <button
            v-for="course in profile.savedCourses"
            :key="course.routeId"
            type="button"
            class="course-link-card"
            @click="openCourse(course)"
          >
            <CourseCard :course="course" />
          </button>
          <EmptyState
            v-if="!profile.savedCourses.length"
            icon="AI"
            tone="route"
            compact
            :title="t('autoPass.ui_ef6d419ef9')"
            :text="t('autoPass.ui_f22f782a88')"
          />
        </div>

        <div v-else class="my-post-list">
          <RouterLink
            v-for="post in profile.posts"
            :key="post.postId"
            class="my-post-card"
            :to="`/community/post/${post.postId}`"
          >
            <div class="my-post-top">
              <span class="my-post-board">{{ (post.tags ?? [])[0] || post.region || t('autoPass.ui_1f458d0b46') }}</span>
              <small>{{ post.date }}</small>
            </div>
            <h2>{{ post.title }}</h2>
            <p>{{ post.body }}</p>
          </RouterLink>
          <EmptyState
            v-if="!profile.posts.length"
            icon="C"
            tone="community"
            compact
            :title="t('autoPass.ui_4504f605c0')"
            :text="t('autoPass.ui_bbade19ec7')"
          />
        </div>
      </template>
    </section>
  </AppLayout>
</template>
