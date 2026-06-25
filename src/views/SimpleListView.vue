<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import AuthorAvatar from '../components/common/AuthorAvatar.vue';
import EmptyState from '../components/common/EmptyState.vue';
import FormStatusNotice from '../components/common/FormStatusNotice.vue';
import FollowUserListItem from '../components/follow/FollowUserListItem.vue';
import ContentCard from '../components/content/ContentCard.vue';
import PlaceCard from '../components/place/PlaceCard.vue';
import CourseCard from '../components/course/CourseCard.vue';
import { useUiStore } from '../stores/uiStore.js';
import { courseTemplates, places } from '../data/mockData.js';
import { localizedNotices } from '../data/notices.js';
import { resolveApiAssetUrl } from '../api/http.js';
import { attachmentUrl, displayableImageAttachments } from '../utils/communityAttachments.js';
import { filterGenericAiCourseTags } from '../utils/tags.js';

const LIST_CONFIG = {
  'liked-content': {
    titleKey: 'my.menu.likedContent',
    empty: { icon: 'C', tone: 'route', titleKey: 'my.activity.empty.likedContent.title', textKey: 'my.activity.empty.likedContent.text', actionKey: 'my.activity.empty.likedContent.action', actionTo: '/contents' },
  },
  'liked-places': {
    titleKey: 'my.menu.likedPlaces',
    empty: { icon: 'P', tone: 'search', titleKey: 'my.activity.empty.likedPlaces.title', textKey: 'my.activity.empty.likedPlaces.text', actionKey: 'my.activity.empty.likedPlaces.action', actionTo: '/places' },
  },
  recent: {
    titleKey: 'my.activity.title.recent',
    empty: { icon: 'KR', tone: 'search', titleKey: 'my.activity.empty.recent.title', textKey: 'my.activity.empty.recent.text', actionKey: 'my.activity.empty.recent.action', actionTo: '/places' },
  },
  planned: {
    titleKey: 'my.visits.planned',
    empty: { icon: 'GO', tone: 'route', titleKey: 'my.activity.empty.planned.title', textKey: 'my.activity.empty.planned.text', actionKey: 'my.activity.empty.planned.action', actionTo: '/places' },
  },
  completed: {
    titleKey: 'my.visits.completed',
    empty: { icon: 'OK', tone: 'route', titleKey: 'my.activity.empty.completed.title', textKey: 'my.activity.empty.completed.text', actionKey: 'my.activity.empty.completed.action', actionTo: '/explore/map' },
  },
  'saved-routes': {
    titleKey: 'my.menu.savedCourses',
    empty: { icon: 'AI', tone: 'route', titleKey: 'my.activity.empty.savedRoutes.title', textKey: 'my.activity.empty.savedRoutes.text', actionKey: 'my.activity.empty.savedRoutes.action', actionTo: '/ai', secondaryKey: 'my.activity.empty.savedRoutes.secondary', secondaryTo: '/home/routes-all' },
  },
  routes: {
    titleKey: 'my.activity.title.routes',
    empty: { icon: 'AI', tone: 'route', titleKey: 'my.activity.empty.routes.title', textKey: 'my.activity.empty.routes.text', actionKey: 'my.activity.empty.routes.action', actionTo: '/ai' },
  },
  posts: {
    titleKey: 'my.menu.myPosts',
    empty: { icon: 'C', tone: 'community', titleKey: 'my.activity.empty.posts.title', textKey: 'my.activity.empty.posts.text', actionKey: 'my.activity.empty.posts.action', actionTo: '/community/write' },
  },
  comments: {
    titleKey: 'my.menu.commentedPosts',
    empty: { icon: 'C', tone: 'community', titleKey: 'my.activity.empty.comments.title', textKey: 'my.activity.empty.comments.text', actionKey: 'my.activity.empty.comments.action', actionTo: '/community' },
  },
  scraps: {
    titleKey: 'my.menu.scraps',
    empty: { icon: 'S', tone: 'community', titleKey: 'my.activity.empty.scraps.title', textKey: 'my.activity.empty.scraps.text', actionKey: 'my.activity.empty.scraps.action', actionTo: '/community' },
  },
  reviews: {
    titleKey: 'my.menu.myReviews',
    empty: { icon: 'R', tone: 'search', titleKey: 'my.activity.empty.reviews.title', textKey: 'my.activity.empty.reviews.text', actionKey: 'my.activity.empty.reviews.action', actionTo: '/places' },
  },
  following: {
    titleKey: 'my.menu.following',
    empty: { icon: 'F', tone: 'community', titleKey: 'my.activity.empty.following.title', textKey: 'my.activity.empty.following.text', actionKey: 'my.activity.empty.following.action', actionTo: '/community' },
  },
  followers: {
    titleKey: 'my.menu.followers',
    empty: { icon: 'F', tone: 'community', titleKey: 'my.activity.empty.followers.title', textKey: 'my.activity.empty.followers.text', actionKey: 'my.activity.empty.followers.action', actionTo: '/community/write' },
  },
  default: {
    titleKey: 'my.activity.title.list',
    empty: { icon: 'SK', tone: 'neutral', titleKey: 'my.activity.empty.default.title', textKey: 'my.activity.empty.default.text' },
  },
};

const route = useRoute();
const router = useRouter();
const uiStore = useUiStore();
const { t } = useI18n();
const type = computed(() => route.meta.type);
const listNotice = ref(null);
const failedPostImageKeys = ref(new Set());
const listConfig = computed(() => LIST_CONFIG[type.value] ?? LIST_CONFIG.default);
const title = computed(() => route.meta.titleKey ? t(route.meta.titleKey) : t(listConfig.value.titleKey));
const noticeItems = computed(() => localizedNotices(t));

onMounted(async () => {
  if (type.value === 'saved-routes') await uiStore.loadSavedCourses();
  if (['liked-content', 'liked-places', 'planned', 'completed'].includes(type.value)) {
    await uiStore.loadEngagementState();
  }
  if (['posts', 'scraps'].includes(type.value)) await uiStore.loadCommunityPosts();
  if (type.value === 'comments') await uiStore.loadMyComments();
  if (type.value === 'reviews') await uiStore.loadMyReviews();
  if (['following', 'followers'].includes(type.value)) await uiStore.loadFollowState();
});

function ownsPost(post) {
  if (!uiStore.currentUser) return false;
  return post.userId ? post.userId === uiStore.currentUser.userId : post.user === uiStore.currentUser.nickname;
}

const myPosts = computed(() => uiStore.communityPosts.filter(ownsPost));
const scrappedPosts = computed(() => uiStore.currentUser
  ? uiStore.communityPosts.filter((item) => (item.scrappedBy ?? []).includes(uiStore.currentUser.userId))
  : []);
const activityPosts = computed(() => {
  if (type.value === 'scraps') return scrappedPosts.value;
  return myPosts.value;
});
const visibleCount = computed(() => {
  if (type.value === 'liked-content') return uiStore.likedContentItems.length;
  if (type.value === 'liked-places') return uiStore.likedPlaceItems.length;
  if (type.value === 'recent') return uiStore.recentPlaceItems.length;
  if (type.value === 'planned') return uiStore.plannedVisitItems.length;
  if (type.value === 'completed') return uiStore.completedVisitItems.length;
  if (type.value === 'saved-routes') return uiStore.savedCourses.length;
  if (type.value === 'routes') return courseTemplates.length;
  if (type.value === 'posts') return myPosts.value.length;
  if (type.value === 'comments') return uiStore.myComments.length;
  if (type.value === 'scraps') return scrappedPosts.value.length;
  if (type.value === 'reviews') return uiStore.myReviews.length;
  if (type.value === 'following') return uiStore.followingUsers.length;
  if (type.value === 'followers') return uiStore.followerUsers.length;
  return noticeItems.value.length;
});
const isLoading = computed(() => {
  if (type.value === 'saved-routes') return uiStore.savedCoursesLoading;
  if (['liked-content', 'liked-places', 'planned', 'completed'].includes(type.value)) return uiStore.engagementLoading;
  if (['posts', 'scraps'].includes(type.value)) return uiStore.communityLoading;
  if (type.value === 'comments') return uiStore.myCommentsLoading;
  if (type.value === 'reviews') return uiStore.myReviewsLoading;
  if (['following', 'followers'].includes(type.value)) return uiStore.followLoading;
  return false;
});
const errorMessage = computed(() => {
  if (type.value === 'saved-routes') return uiStore.routeError;
  if (['liked-content', 'liked-places', 'planned', 'completed'].includes(type.value)) return uiStore.engagementError;
  if (['posts', 'scraps'].includes(type.value)) return uiStore.communityError;
  if (type.value === 'comments') return uiStore.myCommentsError;
  if (type.value === 'reviews') return uiStore.myReviewsError;
  if (['following', 'followers'].includes(type.value)) return uiStore.followError;
  return '';
});
const emptyStateConfig = computed(() => {
  const empty = listConfig.value.empty ?? LIST_CONFIG.default.empty;
  return {
    icon: empty.icon,
    tone: empty.tone,
    title: t(empty.titleKey),
    text: t(empty.textKey),
    actionLabel: empty.actionKey ? t(empty.actionKey) : '',
    actionTo: empty.actionTo ?? '',
    secondaryLabel: empty.secondaryKey ? t(empty.secondaryKey) : '',
    secondaryTo: empty.secondaryTo ?? '',
  };
});

async function reloadList() {
  if (type.value === 'saved-routes') await uiStore.loadSavedCourses();
  if (['liked-content', 'liked-places', 'planned', 'completed'].includes(type.value)) {
    await uiStore.loadEngagementState();
  }
  if (['posts', 'scraps'].includes(type.value)) await uiStore.loadCommunityPosts();
  if (type.value === 'comments') await uiStore.loadMyComments();
  if (type.value === 'reviews') await uiStore.loadMyReviews();
  if (['following', 'followers'].includes(type.value)) await uiStore.loadFollowState();
}

function openCourse(course) {
  const target = type.value === 'saved-routes' ? 'my-course-manage' : 'course-detail';
  router.push({ name: target, params: { routeId: course.routeId } });
}

function displayPostTags(post) {
  const tags = Array.isArray(post?.tags) ? post.tags : [];
  return post?.routeId ? filterGenericAiCourseTags(tags) : tags;
}

function postKey(post) {
  return post?.postId ?? post?.id;
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

function postCommentCount(post) {
  return Number(post?.commentCount ?? post?.commentsCount ?? post?.comments?.length ?? 0);
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

function reviewDate(review) {
  return review.updatedAt?.slice?.(0, 10) || review.createdAt?.slice?.(0, 10) || '';
}

function reviewRatingLabel(review) {
  const rating = review.rating;
  if (rating === undefined || rating === null || rating === '') return t('my.activity.review.noRating');
  return t('my.activity.review.ratingValue', { rating });
}

function reviewPlaceLabel(review) {
  return review.placeName
    ?? review.place?.placeName
    ?? review.place?.name
    ?? places.find((place) => String(place.placeId) === String(review.placeId))?.placeName
    ?? '';
}

function reviewPlaceHelper(review) {
  return reviewPlaceLabel(review);
}

function reviewPlaceTo(review) {
  return review.placeId ? '/places/' + review.placeId : '/places';
}

function followUserInitial(user) {
  return user.nickname?.slice(0, 1).toUpperCase() || 'U';
}

function isFollowActionPending(userId) {
  return uiStore.followActionLoadingIds.some((id) => String(id) === String(userId));
}

const followingIdSet = computed(() => new Set(uiStore.followingUsers.map((user) => String(user.userId))));
function isFollowingUser(user) {
  return user.followedByMe || followingIdSet.value.has(String(user.userId));
}

function followButtonLabel(user) {
  if (isFollowActionPending(user.userId)) return t('my.activity.follow.pending');
  return isFollowingUser(user) ? t('my.activity.follow.following') : t('my.activity.follow.follow');
}

async function toggleFollowFromList(user) {
  if (!user?.userId || user.userId === uiStore.currentUser?.userId) return;
  const following = isFollowingUser(user);
  listNotice.value = null;
  const ok = following
    ? await uiStore.unfollowUser(user.userId, user.nickname)
    : await uiStore.followUser(user.userId, user.nickname);
  if (ok) {
    await uiStore.loadFollowState();
    listNotice.value = null;
    return;
  }
  listNotice.value = {
    tone: 'error',
    title: t('my.activity.follow.errorTitle'),
    text: uiStore.followError || t('my.activity.follow.errorText'),
  };
}
</script>

<template>
  <AppLayout :title="title" back>
    <section class="list-screen">
      <EmptyState
        v-if="isLoading"
        tone="loading"
        compact
        :title="t('my.activity.loadingTitle')"
        :text="t('my.activity.loadingText')"
      />
      <EmptyState
        v-else-if="errorMessage"
        icon="!"
        tone="error"
        compact
        :title="t('my.activity.errorTitle')"
        :text="errorMessage"
        :action-label="t('common.retry')"
        @action="reloadList"
      />

      <div v-else-if="type === 'liked-content'" class="content-grid">
        <RouterLink v-for="content in uiStore.likedContentItems" :key="content.contentId" :to="'/contents/' + content.contentId">
          <ContentCard :content="content" />
        </RouterLink>
      </div>

      <div v-else-if="type === 'liked-places' || type === 'recent' || type === 'planned' || type === 'completed'" class="stack-list">
        <RouterLink
          v-for="place in type === 'completed' ? uiStore.completedVisitItems : type === 'planned' ? uiStore.plannedVisitItems : type === 'recent' ? uiStore.recentPlaceItems : uiStore.likedPlaceItems"
          :key="place.placeId"
          :to="'/places/' + place.placeId"
        >
          <PlaceCard :place="place" compact />
        </RouterLink>
      </div>

      <div v-else-if="type === 'saved-routes'" class="stack-list">
        <article v-for="course in uiStore.savedCourses" :key="course.routeId" class="saved-course-row">
          <button
            type="button"
            class="course-link-card"
            @click="openCourse(course)"
          >
            <CourseCard :course="course" hide-generic-ai-tag />
          </button>
        </article>
      </div>

      <div v-else-if="type === 'routes'" class="stack-list">
        <button
          v-for="course in courseTemplates"
          :key="course.routeId"
          type="button"
          class="course-link-card"
          @click="openCourse(course)"
        >
          <CourseCard :course="course" hide-generic-ai-tag />
        </button>
      </div>

      <div v-else-if="type === 'comments'" class="my-comment-list">
        <RouterLink
          v-for="comment in uiStore.myComments"
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

      <div v-else-if="type === 'posts' || type === 'scraps'" class="feed-list compact-feed-list my-community-feed">
        <article v-for="post in activityPosts" :key="postKey(post)" class="feed-card route-story-card">
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

      <div v-else-if="type === 'reviews'" class="stack-list">
        <RouterLink
          v-for="review in uiStore.myReviews"
          :key="review.reviewId"
          class="activity-review-card"
          :to="reviewPlaceTo(review)"
        >
          <div>
            <strong>{{ reviewRatingLabel(review) }}</strong>
            <small>{{ reviewDate(review) }}</small>
          </div>
          <p>{{ review.content }}</p>
          <span v-if="reviewPlaceHelper(review)">{{ reviewPlaceHelper(review) }}</span>
        </RouterLink>
      </div>

      <div v-else-if="type === 'following' || type === 'followers'" class="user-list">
        <FormStatusNotice
          v-if="listNotice"
          compact
          :tone="listNotice.tone"
          :title="listNotice.title"
          :text="listNotice.text"
        />
        <FollowUserListItem
          v-for="user in type === 'following' ? uiStore.followingUsers : uiStore.followerUsers"
          :key="user.userId"
          :user="user"
          :initial="followUserInitial(user)"
          :current-user-id="uiStore.currentUser?.userId"
          :pending="isFollowActionPending(user.userId)"
          :button-label="followButtonLabel(user)"
          @toggle="toggleFollowFromList"
        />
      </div>

      <div v-else class="stack-list">
        <RouterLink v-for="notice in noticeItems" :key="notice.id" class="notice-row" :to="'/notice/' + notice.id">
          <span>{{ notice.title }}</span>
          <small>{{ notice.date }}</small>
        </RouterLink>
      </div>

      <EmptyState
        v-if="!isLoading && !errorMessage && visibleCount === 0"
        :icon="emptyStateConfig.icon"
        :tone="emptyStateConfig.tone"
        :title="emptyStateConfig.title"
        :text="emptyStateConfig.text"
        compact
        :action-label="emptyStateConfig.actionLabel"
        :action-to="emptyStateConfig.actionTo"
        :secondary-label="emptyStateConfig.secondaryLabel"
        :secondary-to="emptyStateConfig.secondaryTo"
      />
    </section>
  </AppLayout>
</template>
