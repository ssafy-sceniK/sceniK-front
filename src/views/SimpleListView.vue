<script setup>
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import EmptyState from '../components/common/EmptyState.vue';
import ContentCard from '../components/content/ContentCard.vue';
import PlaceCard from '../components/place/PlaceCard.vue';
import CourseCard from '../components/course/CourseCard.vue';
import { useUiStore } from '../stores/uiStore.js';
import { courseTemplates, notices } from '../data/mockData.js';

const route = useRoute();
const router = useRouter();
const uiStore = useUiStore();
const type = computed(() => route.meta.type);
onMounted(async () => {
  if (type.value === 'saved-routes') await uiStore.loadSavedCourses();
  if (['liked-content', 'liked-places', 'planned', 'completed'].includes(type.value)) {
    await uiStore.loadEngagementState();
  }
  if (['posts', 'comments', 'scraps'].includes(type.value)) await uiStore.loadCommunityPosts();
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
  return notices.length;
});
const isLoading = computed(() => {
  if (type.value === 'saved-routes') return uiStore.savedCoursesLoading;
  if (['posts', 'comments', 'scraps'].includes(type.value)) return uiStore.communityLoading;
  return false;
});
const errorMessage = computed(() => {
  if (type.value === 'saved-routes') return uiStore.routeError;
  if (['posts', 'comments', 'scraps'].includes(type.value)) return uiStore.communityError;
  return '';
});
const emptyStateConfig = computed(() => {
  const map = {
    'liked-content': {
      icon: '♥',
      tone: 'route',
      title: '좋아요한 콘텐츠가 없습니다',
      text: '마음에 드는 K-content를 발견하면 하트로 모아둘 수 있어요.',
      actionLabel: '콘텐츠 둘러보기',
      actionTo: '/contents',
    },
    'liked-places': {
      icon: 'P',
      tone: 'search',
      title: '좋아요한 장소가 없습니다',
      text: '가보고 싶은 촬영지를 저장해 나만의 여행 후보를 만들어보세요.',
      actionLabel: '장소 둘러보기',
      actionTo: '/places',
    },
    recent: {
      icon: 'KR',
      tone: 'search',
      title: '최근 본 장소가 없습니다',
      text: '장소를 열어보면 다시 찾기 쉽도록 이곳에 기록됩니다.',
      actionLabel: '장소 탐색하기',
      actionTo: '/places',
    },
    planned: {
      icon: 'GO',
      tone: 'route',
      title: '방문 예정 장소가 없습니다',
      text: '장소 상세에서 방문 예정으로 저장하면 여행 준비 목록이 생깁니다.',
      actionLabel: '장소 탐색하기',
      actionTo: '/places',
    },
    completed: {
      icon: 'OK',
      tone: 'route',
      title: '방문 완료 내역이 없습니다',
      text: '다녀온 촬영지를 방문 완료로 표시하면 여행 기록이 쌓입니다.',
      actionLabel: '장소 탐색하기',
      actionTo: '/places',
    },
    'saved-routes': {
      icon: 'AI',
      tone: 'route',
      title: '저장한 AI 코스가 없습니다',
      text: '좋아하는 K-content를 고르고 첫 여행 코스를 만들어보세요.',
      actionLabel: 'AI 코스 만들기',
      actionTo: '/ai',
      secondaryLabel: '인기 코스 보기',
      secondaryTo: '/home/routes-all',
    },
    posts: {
      icon: 'C',
      tone: 'community',
      title: '작성한 게시글이 없습니다',
      text: '다녀온 코스나 촬영지 팁을 커뮤니티에 공유해보세요.',
      actionLabel: '첫 글 작성하기',
      actionTo: '/community/write',
    },
    comments: {
      icon: 'C',
      tone: 'community',
      title: '댓글 단 글이 없습니다',
      text: '관심 있는 여행 후기에 댓글을 남기면 이곳에서 다시 볼 수 있어요.',
      actionLabel: '커뮤니티 둘러보기',
      actionTo: '/community',
    },
    scraps: {
      icon: 'S',
      tone: 'community',
      title: '스크랩한 게시글이 없습니다',
      text: '다시 보고 싶은 여행 후기와 코스를 스크랩해두세요.',
      actionLabel: '커뮤니티 둘러보기',
      actionTo: '/community',
    },
  };
  return map[type.value] ?? {
    icon: 'SK',
    tone: 'neutral',
    title: '표시할 항목이 없습니다',
    text: '서비스를 사용하면 기록이 이곳에 차곡차곡 쌓입니다.',
  };
});

async function reloadList() {
  if (type.value === 'saved-routes') await uiStore.loadSavedCourses();
  if (['liked-content', 'liked-places', 'planned', 'completed'].includes(type.value)) {
    await uiStore.loadEngagementState();
  }
  if (['posts', 'comments', 'scraps'].includes(type.value)) await uiStore.loadCommunityPosts();
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

function postMeta(post) {
  return [post.date, post.region].filter(Boolean).join(' · ');
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
            <span>댓글 {{ post.comments?.length ?? 0 }}</span>
            <span>{{ post.routeId ? 'AI 코스 연결됨' : '일반 후기' }}</span>
          </div>
        </RouterLink>
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
        :action-label="emptyStateConfig.actionLabel"
        :action-to="emptyStateConfig.actionTo"
        :secondary-label="emptyStateConfig.secondaryLabel"
        :secondary-to="emptyStateConfig.secondaryTo"
      />
    </section>
  </AppLayout>
</template>
