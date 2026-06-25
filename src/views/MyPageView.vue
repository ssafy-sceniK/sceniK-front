<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useUiStore } from '../stores/uiStore.js';
import { localizePreferenceOption } from '../i18n/systemContent.js';
import AppLayout from '../components/layout/AppLayout.vue';
import AuthorAvatar from '../components/common/AuthorAvatar.vue';
import PlaceCard from '../components/place/PlaceCard.vue';
import EmptyState from '../components/common/EmptyState.vue';
import ProfileAvatar from '../components/common/ProfileAvatar.vue';
import { resolveApiAssetUrl } from '../api/http.js';
import { normalizePreferenceSelection } from '../utils/preferences.js';
import { attachmentUrl, displayableImageAttachments } from '../utils/communityAttachments.js';
import { filterGenericAiCourseTags } from '../utils/tags.js';

const router = useRouter();
const uiStore = useUiStore();
const { t, locale } = useI18n();
const activeTab = ref('activity');
const failedPostImageKeys = ref(new Set());

onMounted(async () => {
  if (!uiStore.currentUser) return;
  await Promise.all([
    uiStore.loadSavedCourses(),
    uiStore.loadEngagementState(),
    uiStore.loadCommunityPosts(),
    uiStore.loadMyComments(),
    uiStore.loadMyReviews(),
    uiStore.loadFollowState(),
  ]);
});

function ownsPost(post) {
  if (!uiStore.currentUser) return false;
  return post.userId ? post.userId === uiStore.currentUser.userId : post.user === uiStore.currentUser.nickname;
}

const myPosts = computed(() => uiStore.communityPosts.filter(ownsPost));
const scrappedPosts = computed(() => uiStore.currentUser
  ? uiStore.communityPosts.filter((post) => (post.scrappedBy ?? []).includes(uiStore.currentUser.userId))
  : []);
const profileInitial = computed(() => uiStore.currentUser?.nickname?.slice(0, 1).toUpperCase() ?? 'K');
const profileBio = computed(() => uiStore.currentUser?.bio || t('my.profile.defaultBio'));
const profileImageUrl = computed(() => uiStore.currentUser?.profileImageUrl ?? '');
function preferenceChip(group, value) {
  return {
    key: `${group}:${value}`,
    label: localizePreferenceOption(group, value, t, locale.value),
  };
}

const profilePreferenceChips = computed(() => {
  const preferences = normalizePreferenceSelection(uiStore.currentUser?.preferences);
  return [
    ...preferences.contentTypes.map((value) => preferenceChip('contentTypes', value)),
    ...preferences.regions.map((value) => preferenceChip('regions', value)),
    ...preferences.themes.map((value) => preferenceChip('themes', value)),
  ].slice(0, 6);
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

function postKey(post) {
  return post?.postId ?? post?.id;
}

function postCommentCount(post) {
  return Number(post?.commentCount ?? post?.commentsCount ?? post?.comments?.length ?? 0);
}

function displayPostTags(post) {
  const tags = Array.isArray(post?.tags) ? post.tags : [];
  return post?.routeId ? filterGenericAiCourseTags(tags) : tags;
}

function displayUserName(post) {
  return post?.user ?? post?.nickname ?? post?.authorNickname ?? uiStore.currentUser?.nickname ?? 'sceniK user';
}

function userInitial(post) {
  return displayUserName(post).slice(0, 1).toUpperCase() || 'K';
}

function authorProfileImageUrl(post) {
  return post?.authorProfileImageUrl ?? post?.profileImageUrl ?? post?.authorImageUrl ?? '';
}

function postTimeLabel(post) {
  return post?.date ?? post?.createdAt?.slice?.(0, 10) ?? '';
}

function postImageFailureKey(post, url, index) {
  return `${postKey(post)}:${index}:${url}`;
}

function markPostImageFailed(post, url, index) {
  failedPostImageKeys.value = new Set([...failedPostImageKeys.value, postImageFailureKey(post, url, index)]);
}

function postImageSources(post) {
  const attachments = displayableImageAttachments(post?.attachments ?? [])
    .map((attachment) => resolveApiAssetUrl(attachmentUrl(attachment)))
    .filter(Boolean);
  const direct = [
    post?.imageUrl,
    post?.thumbnailUrl,
    post?.coverImageUrl,
    post?.attachmentUrl,
  ].map(resolveApiAssetUrl).filter(Boolean);
  return [...new Set([...attachments, ...direct])]
    .filter((url, index) => !failedPostImageKeys.value.has(postImageFailureKey(post, url, index)));
}

function commentTimeLabel(comment) {
  return comment?.date ?? comment?.createdAt?.slice?.(0, 10) ?? '';
}

function commentTo(comment) {
  return comment?.to ?? (comment?.postId ? `/community/post/${comment.postId}#community-comments` : '/community');
}

function commentPreviewText(comment) {
  return comment?.text ?? comment?.content ?? '';
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
            <span v-for="item in profilePreferenceChips" :key="item.key">{{ item.label }}</span>
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

      <div class="my-section-tabs" :aria-label="t('my.tabs.aria')">
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
          <strong>{{ t('my.visits.totalCompleted', { total: totalVisitCount, completed: completedCount }) }}</strong>
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
          :title="t('my.visits.emptyTitle')"
          :text="t('my.cleanup.k9ea895ec86')"
          :action-label="t('place.list.title')"
          action-to="/explore/map"
        />
      </div>

      <div v-else class="my-section-panel">
        <div class="section-mini-header">
          <h2>{{ t('my.menu.myPosts') }}</h2>
          <RouterLink to="/my/posts">{{ t('common.viewAll') }}</RouterLink>
        </div>
        <div v-if="myPosts.length" class="feed-list compact-feed-list my-community-feed">
          <article v-for="post in myPosts.slice(0, 3)" :key="postKey(post)" class="feed-card route-story-card">
            <div class="feed-card-author-row">
              <RouterLink class="feed-author-profile-link" :to="`/users/${post.userId}`">
                <AuthorAvatar class="comment-avatar feed-author-avatar" :image-url="authorProfileImageUrl(post)" :initial="userInitial(post)" alt="" />
                <span class="feed-author-copy">
                  <b>{{ displayUserName(post) }}</b>
                  <span>{{ postTimeLabel(post) }}</span>
                </span>
              </RouterLink>
            </div>
            <RouterLink class="feed-card-main" :class="{ 'feed-card-main--text-only': !postImageSources(post).length }" :to="'/community/post/' + postKey(post)">
              <span v-if="postImageSources(post).length" class="feed-thumb feed-thumb--image">
                <img :src="postImageSources(post)[0]" alt="" @error="markPostImageFailed(post, postImageSources(post)[0], 0)" />
              </span>
              <span class="feed-body">
                <h2>{{ post.title }}</h2>
                <p>{{ post.body }}</p>
                <span class="tag-row">
                  <span v-for="tag in displayPostTags(post).slice(0, 3)" :key="tag">{{ tag }}</span>
                </span>
              </span>
            </RouterLink>
            <div class="feed-actions compact-actions" aria-label="post stats">
              <span>{{ t('my.activity.likes', { count: post.likes ?? 0 }) }}</span>
              <span>{{ t('my.activity.comments', { count: postCommentCount(post) }) }}</span>
              <span>{{ post.routeId ? t('my.activity.linkedAiCourse') : t('my.activity.generalStory') }}</span>
            </div>
          </article>
        </div>
        <EmptyState
          v-else
          icon="C"
          tone="community"
          compact
          :title="t('my.activity.empty.posts.title')"
          :text="t('my.activity.empty.posts.text')"
          :action-label="t('my.activity.empty.posts.action')"
          action-to="/community/write"
        />

        <div class="section-mini-header with-divider">
          <h2>{{ t('my.menu.commentedPosts') }}</h2>
          <RouterLink to="/my/comments">{{ t('common.viewAll') }}</RouterLink>
        </div>
        <div v-if="uiStore.myComments.length" class="my-comment-list">
          <RouterLink
            v-for="comment in uiStore.myComments.slice(0, 4)"
            :key="comment.commentId"
            class="my-comment-card"
            :to="commentTo(comment)"
          >
            <div>
              <strong>{{ comment.postTitle || t('community.detail.title') }}</strong>
              <small>{{ commentTimeLabel(comment) }}</small>
            </div>
            <p>{{ commentPreviewText(comment) }}</p>
          </RouterLink>
        </div>
        <EmptyState
          v-else
          icon="C"
          tone="community"
          compact
          :title="t('my.activity.empty.comments.title')"
          :text="t('my.activity.empty.comments.text')"
          :action-label="t('my.activity.empty.comments.action')"
          action-to="/community"
        />

        <div class="my-menu-list">
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
