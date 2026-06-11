<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import EmptyState from '../components/common/EmptyState.vue';
import FormStatusNotice from '../components/common/FormStatusNotice.vue';
import FollowUserListItem from '../components/follow/FollowUserListItem.vue';
import ContentCard from '../components/content/ContentCard.vue';
import PlaceCard from '../components/place/PlaceCard.vue';
import CourseCard from '../components/course/CourseCard.vue';
import { useUiStore } from '../stores/uiStore.js';
import { courseTemplates, notices } from '../data/mockData.js';

const route = useRoute();
const router = useRouter();
const uiStore = useUiStore();
const type = computed(() => route.meta.type);
const listNotice = ref(null);
onMounted(async () => {
  if (type.value === 'saved-routes') await uiStore.loadSavedCourses();
  if (['liked-content', 'liked-places', 'planned', 'completed'].includes(type.value)) {
    await uiStore.loadEngagementState();
  }
  if (['posts', 'comments', 'scraps'].includes(type.value)) await uiStore.loadCommunityPosts();
  if (type.value === 'reviews') await uiStore.loadMyReviews();
  if (['following', 'followers'].includes(type.value)) await uiStore.loadFollowState();
});
const title = computed(() => route.meta.title || '목록');

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
  ? uiStore.communityPosts.filter((item) => (item.scrappedBy ?? []).includes(uiStore.currentUser.userId))
  : []);
const activityPosts = computed(() => {
  if (type.value === 'scraps') return scrappedPosts.value;
  if (type.value === 'comments') return commentedPosts.value;
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
  if (type.value === 'comments') return commentedPosts.value.length;
  if (type.value === 'scraps') return scrappedPosts.value.length;
  if (type.value === 'reviews') return uiStore.myReviews.length;
  if (type.value === 'following') return uiStore.followingUsers.length;
  if (type.value === 'followers') return uiStore.followerUsers.length;
  return notices.length;
});
const isLoading = computed(() => {
  if (type.value === 'saved-routes') return uiStore.savedCoursesLoading;
  if (['posts', 'comments', 'scraps'].includes(type.value)) return uiStore.communityLoading;
  if (type.value === 'reviews') return uiStore.myReviewsLoading;
  if (['following', 'followers'].includes(type.value)) return uiStore.followLoading;
  return false;
});
const errorMessage = computed(() => {
  if (type.value === 'saved-routes') return uiStore.routeError;
  if (['posts', 'comments', 'scraps'].includes(type.value)) return uiStore.communityError;
  if (type.value === 'reviews') return uiStore.myReviewsError;
  if (['following', 'followers'].includes(type.value)) return uiStore.followError;
  return '';
});
const emptyStateConfig = computed(() => {
  const map = {
    'liked-content': {
      icon: '♥',
      tone: 'route',
      title: '좋아요한 콘텐츠가 없어요',
      text: '마음에 드는 K-content를 발견하면 하트로 모아둘 수 있어요.',
      actionLabel: '콘텐츠 둘러보기',
      actionTo: '/contents',
    },
    'liked-places': {
      icon: 'P',
      tone: 'search',
      title: '좋아요한 장소가 없어요',
      text: '가보고 싶은 촬영지를 저장해 나만의 여행 후보를 만들어보세요.',
      actionLabel: '장소 둘러보기',
      actionTo: '/places',
    },
    recent: {
      icon: 'KR',
      tone: 'search',
      title: '최근 본 장소가 없어요',
      text: '장소를 열어보면 다시 찾기 쉽도록 이곳에 기록됩니다.',
      actionLabel: '장소 탐색하기',
      actionTo: '/places',
    },
    planned: {
      icon: 'GO',
      tone: 'route',
      title: '예정된 방문 장소가 없어요',
      text: '장소 상세에서 방문 예정으로 저장하면 여행 준비 목록이 생겨요.',
      actionLabel: '장소 탐색하기',
      actionTo: '/places',
    },
    completed: {
      icon: 'OK',
      tone: 'route',
      title: '방문 완료한 장소가 없어요',
      text: '다녀온 촬영지를 방문 완료로 표시하면 여행 기록이 쌓여요.',
      actionLabel: '장소 탐색하기',
      actionTo: '/places',
    },
    'saved-routes': {
      icon: 'AI',
      tone: 'route',
      title: '저장한 코스가 없어요',
      text: '좋아하는 K-content를 고르고 첫 여행 코스를 만들어보세요.',
      actionLabel: 'AI 코스 만들기',
      actionTo: '/ai',
      secondaryLabel: '인기 코스 보기',
      secondaryTo: '/home/routes-all',
    },
    posts: {
      icon: 'C',
      tone: 'community',
      title: '아직 작성한 게시글이 없어요',
      text: '다녀온 코스나 촬영지 팁을 커뮤니티에 공유해보세요.',
      actionLabel: '게시글 작성하기',
      actionTo: '/community/write',
    },
    comments: {
      icon: 'C',
      tone: 'community',
      title: '댓글 단 글이 없어요',
      text: '관심 있는 여행 후기에 댓글을 남기면 이곳에서 다시 볼 수 있어요.',
      actionLabel: '커뮤니티 둘러보기',
      actionTo: '/community',
    },
    scraps: {
      icon: 'S',
      tone: 'community',
      title: '스크랩한 게시글이 없어요',
      text: '다시 보고 싶은 여행 후기와 코스를 스크랩해두세요.',
      actionLabel: '커뮤니티 둘러보기',
      actionTo: '/community',
    },
    reviews: {
      icon: 'R',
      tone: 'search',
      title: '아직 리뷰가 없어요',
      text: '다녀온 촬영지의 분위기와 이동 팁을 장소 상세에서 남겨보세요.',
      actionLabel: '장소 둘러보기',
      actionTo: '/places',
    },
    following: {
      icon: 'F',
      tone: 'community',
      title: '팔로잉한 사용자가 없어요',
      text: '커뮤니티 게시글 작성자를 팔로우하면 이곳에서 다시 볼 수 있어요.',
      actionLabel: '커뮤니티 둘러보기',
      actionTo: '/community',
    },
    followers: {
      icon: 'F',
      tone: 'community',
      title: '아직 팔로워가 없습니다',
      text: '커뮤니티에 여행 후기와 촬영지 팁을 공유해보세요.',
      actionLabel: '글 작성하기',
      actionTo: '/community/write',
    },
  };
  return map[type.value] ?? {
    icon: 'SK',
    tone: 'neutral',
    title: '표시할 항목이 없어요',
    text: '서비스를 사용하면 기록이 이곳에 차곡차곡 쌓입니다.',
  };
});

async function reloadList() {
  if (type.value === 'saved-routes') await uiStore.loadSavedCourses();
  if (['liked-content', 'liked-places', 'planned', 'completed'].includes(type.value)) {
    await uiStore.loadEngagementState();
  }
  if (['posts', 'comments', 'scraps'].includes(type.value)) await uiStore.loadCommunityPosts();
  if (type.value === 'reviews') await uiStore.loadMyReviews();
  if (['following', 'followers'].includes(type.value)) await uiStore.loadFollowState();
}

function openCourse(course) {
  const target = type.value === 'saved-routes' ? 'my-course-manage' : 'course-detail';
  router.push({ name: target, params: { routeId: course.routeId } });
}

function boardLabel(post) {
  const tag = (post.tags ?? [])[0] ?? '';
  if (tag.includes('드라마')) return '드라마';
  if (tag.includes('영화')) return '영화';
  if (tag.includes('아이돌') || tag.includes('K-pop')) return '아이돌';
  if (tag.includes('예능')) return '예능';
  return post.region ? `${post.region} 코스` : 'AI 코스';
}

function postCommentPreview(post) {
  if (!uiStore.currentUser) return '';
  return (post.comments ?? []).find((comment) => comment.user === uiStore.currentUser.nickname)?.text ?? '';
}

function postCommentCount(post) {
  return Number(post?.commentCount ?? post?.commentsCount ?? post?.comments?.length ?? 0);
}

function postMeta(post) {
  return [post.date, post.region].filter(Boolean).join(' · ');
}

function reviewDate(review) {
  return review.updatedAt?.slice?.(0, 10) || review.createdAt?.slice?.(0, 10) || '';
}

function reviewPlaceTo(review) {
  return review.placeId ? `/places/${review.placeId}` : '/places';
}

function followUserInitial(user) {
  return user.nickname?.slice(0, 1).toUpperCase() || 'U';
}

function isFollowActionPending(userId) {
  return uiStore.followActionLoadingIds.some((id) => String(id) === String(userId));
}

const followingIdSet = computed(() => new Set(uiStore.followingUsers.map((user) => String(user.userId))));
const followerIdSet = computed(() => new Set(uiStore.followerUsers.map((user) => String(user.userId))));

function isMutualFollow(user) {
  const userId = String(user.userId);
  if (type.value === 'following') return followerIdSet.value.has(userId);
  return followingIdSet.value.has(userId) || user.followedByMe;
}

function followButtonLabel(user) {
  if (isFollowActionPending(user.userId)) return '처리 중';
  if (isMutualFollow(user)) return '맞팔';
  return user.followedByMe || followingIdSet.value.has(String(user.userId)) ? '팔로잉' : '팔로우';
}

async function toggleFollowFromList(user) {
  if (!user?.userId || user.userId === uiStore.currentUser?.userId) return;
  const following = user.followedByMe || followingIdSet.value.has(String(user.userId));
  listNotice.value = {
    tone: 'info',
    title: following ? '팔로우를 취소하는 중입니다.' : '팔로우하는 중입니다.',
    text: `${user.nickname}님의 팔로우 상태를 backend와 동기화하고 있습니다.`,
  };
  const ok = following
    ? await uiStore.unfollowUser(user.userId)
    : await uiStore.followUser(user.userId);
  if (ok) {
    await uiStore.loadFollowState();
    listNotice.value = {
      tone: 'success',
      title: following ? '팔로우를 취소했습니다.' : '팔로우했습니다.',
      text: '팔로워/팔로잉 목록이 갱신되었습니다.',
    };
    return;
  }
  listNotice.value = {
    tone: 'error',
    title: '팔로우 상태를 변경하지 못했습니다.',
    text: uiStore.followError || '로그인 상태를 확인한 뒤 다시 시도해 주세요.',
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
        title="목록을 불러오는 중입니다"
        text="저장된 활동을 확인하고 있어요."
      />
      <EmptyState
        v-else-if="errorMessage"
        icon="!"
        tone="error"
        compact
        title="목록을 불러오지 못했습니다"
        :text="errorMessage"
        action-label="다시 시도"
        @action="reloadList"
      />

      <div v-else-if="type === 'liked-content'" class="content-grid">
        <RouterLink v-for="content in uiStore.likedContentItems" :key="content.contentId" :to="`/contents/${content.contentId}`">
          <ContentCard :content="content" />
        </RouterLink>
      </div>

      <div v-else-if="type === 'liked-places' || type === 'recent' || type === 'planned' || type === 'completed'" class="stack-list">
        <RouterLink
          v-for="place in type === 'completed' ? uiStore.completedVisitItems : type === 'planned' ? uiStore.plannedVisitItems : type === 'recent' ? uiStore.recentPlaceItems : uiStore.likedPlaceItems"
          :key="place.placeId"
          :to="`/places/${place.placeId}`"
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
            <CourseCard :course="course" />
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
          <CourseCard :course="course" />
        </button>
      </div>

      <div v-else-if="type === 'posts' || type === 'scraps' || type === 'comments'" class="my-post-list">
        <RouterLink
          v-for="post in activityPosts"
          :key="post.id"
          class="my-post-card"
          :to="`/community/post/${post.id}`"
        >
          <div class="my-post-top">
            <span class="my-post-board">{{ boardLabel(post) }}</span>
            <small>{{ postMeta(post) }}</small>
          </div>
          <h2>{{ post.title }}</h2>
          <p>{{ post.body }}</p>
          <blockquote v-if="type === 'comments' && postCommentPreview(post)">
            내 댓글 · {{ postCommentPreview(post) }}
          </blockquote>
          <div class="tag-row">
            <span v-for="tag in (post.tags ?? []).slice(0, 3)" :key="tag">{{ tag }}</span>
          </div>
          <div class="my-post-meta">
            <span>♡ {{ post.likes ?? 0 }}</span>
            <span>댓글 {{ postCommentCount(post) }}</span>
            <span>{{ post.routeId ? 'AI 코스 연결됨' : '일반 후기' }}</span>
          </div>
        </RouterLink>
      </div>

      <div v-else-if="type === 'reviews'" class="stack-list">
        <RouterLink
          v-for="review in uiStore.myReviews"
          :key="review.reviewId"
          class="activity-review-card"
          :to="reviewPlaceTo(review)"
        >
          <div>
            <strong>★ {{ review.rating ?? '평점 없음' }}</strong>
            <small>{{ reviewDate(review) }}</small>
          </div>
          <p>{{ review.content }}</p>
          <span>{{ review.placeId }} 장소 상세에서 수정/삭제 가능</span>
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
          :mutual="isMutualFollow(user)"
          :current-user-id="uiStore.currentUser?.userId"
          :pending="isFollowActionPending(user.userId)"
          :button-label="followButtonLabel(user)"
          @toggle="toggleFollowFromList"
        />
      </div>

      <div v-else class="stack-list">
        <RouterLink v-for="notice in notices" :key="notice.id" class="notice-row" :to="`/notice/${notice.id}`">
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
