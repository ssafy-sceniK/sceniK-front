<script setup>
import { useI18n } from 'vue-i18n';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import AuthorAvatar from '../components/common/AuthorAvatar.vue';
import EmptyState from '../components/common/EmptyState.vue';
import ProfileAvatar from '../components/common/ProfileAvatar.vue';
import CourseCard from '../components/course/CourseCard.vue';
import { fetchPublicProfile } from '../api/followApi.js';
import { getUserMessage } from '../api/error.js';
import { resolveApiAssetUrl } from '../api/http.js';
import { useUiStore } from '../stores/uiStore.js';
import { attachmentUrl, displayableImageAttachments } from '../utils/communityAttachments.js';
import { filterDisplayTags } from '../utils/tags.js';

const { t } = useI18n();

const route = useRoute();
const router = useRouter();
const uiStore = useUiStore();
const profile = ref(null);
const loading = ref(false);
const error = ref('');
const activeTab = ref('courses');
const failedPostImageKeys = ref(new Set());

const user = computed(() => profile.value?.user ?? null);
const isMe = computed(() => String(user.value?.userId ?? '') === String(uiStore.currentUser?.userId ?? ''));
const profileBio = computed(() => user.value?.bio?.trim() ?? '');
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

function displayPostTags(post) {
  return filterDisplayTags(Array.isArray(post?.tags) ? post.tags : []);
}

function postKey(post) {
  return post?.postId ?? post?.id;
}

function displayUserName(post) {
  return post?.nickname || post?.user || post?.authorName || user.value?.nickname || 'sceniK user';
}

function userInitial(post) {
  return displayUserName(post).slice(0, 1).toUpperCase() || 'K';
}

function authorProfileImageUrl(post) {
  return [
    post?.authorProfileImageUrl,
    post?.profileImageUrl,
    post?.authorImageUrl,
    post?.userProfileImageUrl,
    post?.profile_image_url,
    post?.avatarUrl,
    post?.avatar_url,
    user.value?.profileImageUrl,
  ].find((value) => typeof value === 'string' && value.trim()) ?? '';
}

function userProfileTo(userId) {
  return userId ? { name: 'user-profile', params: { userId } } : '';
}

function postTimeLabel(post) {
  return post?.date ?? post?.createdAt?.slice?.(0, 10) ?? '';
}

function postImageFailureKey(post, image) {
  return `${postKey(post) || 'post'}::${image}`;
}

function markPostImageFailed(post, image) {
  const next = new Set(failedPostImageKeys.value);
  next.add(postImageFailureKey(post, image));
  failedPostImageKeys.value = next;
}

function postImageSources(post) {
  const directImages = [
    post?.imageUrl,
    post?.image_url,
    post?.thumbnailUrl,
    post?.thumbnail_url,
    post?.coverImageUrl,
    post?.cover_image_url,
    post?.attachmentUrl,
    post?.attachment_url,
  ].map(resolveApiAssetUrl).filter(Boolean);
  const attachmentImages = displayableImageAttachments(post?.attachments ?? [])
    .map((attachment) => resolveApiAssetUrl(attachmentUrl(attachment)))
    .filter(Boolean);
  return [...new Set([...directImages, ...attachmentImages])]
    .filter((image) => !failedPostImageKeys.value.has(postImageFailureKey(post, image)));
}

function postCommentCount(post) {
  return Number(post?.commentCount ?? post?.commentsCount ?? post?.comments?.length ?? 0);
}

function isPostLiked(post) {
  return Boolean(post?.isLiked || (uiStore.currentUser?.userId && (post.likedBy ?? []).includes(uiStore.currentUser.userId)));
}

function isPostScrapped(post) {
  return Boolean(uiStore.currentUser?.userId && (post.scrappedBy ?? []).includes(uiStore.currentUser.userId));
}

function isPostLikePending(post) {
  const key = postKey(post);
  return uiStore.pendingPostLikes.some((id) => String(id) === String(key));
}

async function togglePostLike(post) {
  const key = postKey(post);
  if (!key) return;
  await uiStore.togglePostLike(key);
  await loadProfile();
}

async function togglePostScrap(post) {
  const key = postKey(post);
  if (!key) return;
  await uiStore.togglePostScrap(key);
  await loadProfile();
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
          <ProfileAvatar :image-url="user.profileImageUrl" :alt="t('autoPass.ui_d4a0532b58')" />
          <div class="profile-copy">
            <div class="profile-name-row">
              <h1>{{ user.nickname }}</h1>
              <span>{{ t('autoPass.ui_bcaf3ba329', { count: profile.followerCount }) }}</span>
            </div>
            <p v-if="profileBio">{{ profileBio }}</p>
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
            <CourseCard :course="course" hide-generic-ai-tag />
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

        <div v-else class="feed-list compact-feed-list public-profile-feed">
          <article v-for="post in profile.posts" :key="postKey(post)" class="feed-card route-story-card">
            <div class="feed-card-author-row">
              <div class="user-row feed-author-copy">
                <RouterLink v-if="post.userId" class="feed-author-profile-link" :to="userProfileTo(post.userId)">
                  <AuthorAvatar class="comment-avatar feed-author-avatar" :image-url="authorProfileImageUrl(post)" :initial="userInitial(post)" alt="" />
                  <b>{{ displayUserName(post) }}</b>
                </RouterLink>
                <b v-else>{{ displayUserName(post) }}</b>
                <span>{{ postTimeLabel(post) }}</span>
              </div>
            </div>
            <RouterLink
              class="feed-card-main"
              :class="{ 'feed-card-main--text-only': !postImageSources(post).length }"
              :to="'/community/post/' + postKey(post)"
            >
              <div v-if="postImageSources(post).length" class="feed-thumb feed-thumb--image">
                <img :src="postImageSources(post)[0]" alt="" @error="markPostImageFailed(post, postImageSources(post)[0])" />
                <span v-if="postImageSources(post).length > 1" class="feed-thumb-count">+{{ postImageSources(post).length - 1 }}</span>
              </div>
              <div class="feed-body">
                <h2>{{ post.title }}</h2>
                <p>{{ post.body }}</p>
                <div v-if="displayPostTags(post).length" class="tag-row">
                  <span v-for="tag in displayPostTags(post)" :key="tag">{{ tag }}</span>
                </div>
              </div>
            </RouterLink>
            <div class="feed-actions compact-actions">
              <button
                type="button"
                :class="{ 'is-active': isPostLiked(post) }"
                :aria-pressed="isPostLiked(post)"
                :disabled="isPostLikePending(post)"
                @click="togglePostLike(post)"
              >
                <span class="action-icon">{{ isPostLiked(post) ? '♥' : '♡' }}</span>
                {{ post.likes }}
              </button>
              <RouterLink :to="'/community/post/' + postKey(post)">{{ t('communityAuto2.k1v', { count: postCommentCount(post) }) }}</RouterLink>
              <button
                type="button"
                :class="{ 'is-active': isPostScrapped(post) }"
                @click="togglePostScrap(post)"
              >
                {{ isPostScrapped(post) ? t('communityAuto.ksf2n5k') : t('communityAuto.k1y81wz0') }}
              </button>
            </div>
          </article>
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
