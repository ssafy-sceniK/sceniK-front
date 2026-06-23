<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import EmptyState from '../components/common/EmptyState.vue';
import ProfileAvatar from '../components/common/ProfileAvatar.vue';
import CourseCard from '../components/course/CourseCard.vue';
import { fetchPublicProfile } from '../api/followApi.js';
import { getUserMessage } from '../api/error.js';
import { useUiStore } from '../stores/uiStore.js';

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
    error.value = getUserMessage(err, '사용자 프로필을 불러오지 못했습니다.');
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
  <AppLayout title="프로필" back>
    <section class="public-profile-screen">
      <EmptyState
        v-if="loading"
        tone="loading"
        compact
        title="프로필을 불러오는 중입니다"
        text="사용자의 저장 코스와 커뮤니티 활동을 확인하고 있어요."
      />
      <EmptyState
        v-else-if="error"
        icon="!"
        tone="error"
        compact
        title="프로필을 불러오지 못했습니다"
        :text="error"
        action-label="다시 시도"
        @action="loadProfile"
      />
      <template v-else-if="user">
        <section class="profile-card public-profile-card">
          <ProfileAvatar :image-url="user.profileImageUrl" :initial="initial" alt="프로필 이미지" />
          <div class="profile-copy">
            <div class="profile-name-row">
              <h1>{{ user.nickname }}</h1>
              <span>{{ profile.followerCount }} 팔로워</span>
            </div>
            <p>{{ user.bio || 'K-content 여행자' }}</p>
            <small class="profile-meta">팔로잉 {{ profile.followingCount }}명</small>
            <div v-if="preferenceChips.length" class="profile-preference-chips">
              <span v-for="item in preferenceChips" :key="item">{{ item }}</span>
            </div>
          </div>
          <div v-if="!isMe" class="profile-actions">
            <button type="button" class="profile-edit-button" @click="toggleFollow">
              {{ profile.followedByMe ? '팔로잉' : '팔로우' }}
            </button>
          </div>
        </section>

        <div class="my-section-tabs public-profile-tabs" aria-label="프로필 활동">
          <button type="button" :class="{ active: activeTab === 'courses' }" @click="activeTab = 'courses'">
            <strong>저장 코스</strong>
          </button>
          <button type="button" :class="{ active: activeTab === 'posts' }" @click="activeTab = 'posts'">
            <strong>게시글</strong>
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
            title="공개된 저장 코스가 없습니다"
            text="이 사용자가 저장한 AI 코스가 있으면 여기에 표시됩니다."
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
              <span class="my-post-board">{{ (post.tags ?? [])[0] || post.region || '커뮤니티' }}</span>
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
            title="작성한 게시글이 없습니다"
            text="커뮤니티 활동이 생기면 여기에 표시됩니다."
          />
        </div>
      </template>
    </section>
  </AppLayout>
</template>