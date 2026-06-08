<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import SearchBar from '../components/common/SearchBar.vue';
import BaseButton from '../components/common/BaseButton.vue';
import EmptyState from '../components/common/EmptyState.vue';
import { useUiStore } from '../stores/uiStore.js';

const route = useRoute();
const router = useRouter();
const uiStore = useUiStore();
const query = ref('');
const title = ref('');
const body = ref('');
const commentText = ref('');
const editingCommentId = ref('');
const editingCommentText = ref('');
const commentActionLoading = ref(false);
const shareTarget = ref(null);

const boards = [
  { id: 'drama', icon: '🎬', name: '드라마 게시판', description: '드라마 촬영지 후기와 코스 공유', tag: '드라마' },
  { id: 'movie', icon: '🎞️', name: '영화 게시판', description: '영화 장면을 따라간 장소 후기', tag: '영화' },
  { id: 'idol', icon: '🎤', name: '아이돌 게시판', description: '성지 투어와 팬 여행 기록', tag: '아이돌' },
  { id: 'variety', icon: '📺', name: '예능 게시판', description: '예능 촬영지와 방문 팁', tag: '예능' },
  { id: 'region', icon: '📍', name: '지역별 게시판', description: '지역별 여행 코스와 장소 후기', tag: 'AI 코스' },
];

const isBoardList = computed(() => route.name === 'community-boards');
const isBoardFeed = computed(() => route.name === 'community-drama-board');
const isPostDetail = computed(() => route.name === 'community-post');
const composeMode = computed(() => route.meta.compose);
const activeBoard = computed(() => boards.find((board) => board.id === route.query.board) ?? boards[0]);
const activeMode = computed(() => (isBoardList.value || isBoardFeed.value ? 'boards' : 'all'));

async function loadCommunity() {
  const params = isBoardFeed.value ? { board: activeBoard.value.id } : {};
  await uiStore.loadCommunityPosts(params);
  if (isPostDetail.value && route.params.id) {
    await uiStore.loadCommunityPost(route.params.id);
  }
}

onMounted(loadCommunity);
watch(() => `${route.name ?? ''}:${route.params.id ?? ''}:${route.query.board ?? ''}`, loadCommunity);

const filteredPosts = computed(() => {
  const normalizedQuery = query.value.trim().toLowerCase();
  return uiStore.communityPosts.filter((post) => {
    const haystack = `${post.title} ${post.body} ${(post.tags ?? []).join(' ')}`.toLowerCase();
    const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
    const matchesBoard = !isBoardFeed.value || (post.tags ?? []).some((tag) => tag.includes(activeBoard.value.tag));
    return matchesQuery && matchesBoard;
  });
});
const feedEmptyState = computed(() => {
  if (query.value.trim()) {
    return {
      title: '검색 결과가 없습니다',
      text: '다른 키워드로 다시 검색하거나 전체 커뮤니티 글을 확인해보세요.',
      actionLabel: '검색어 지우기',
      actionTo: '',
      secondaryLabel: '글 작성하기',
      secondaryTo: '/community/write',
    };
  }

  if (isBoardFeed.value) {
    return {
      title: `${activeBoard.value.name}에 아직 글이 없습니다`,
      text: '첫 여행 후기나 촬영지 팁을 남겨 게시판을 채워보세요.',
      actionLabel: '첫 글 작성하기',
      actionTo: '/community/write',
      secondaryLabel: '게시판 보기',
      secondaryTo: '/community/boards',
    };
  }

  return {
    title: '아직 커뮤니티 글이 없습니다',
    text: '다녀온 코스, 촬영지 팁, 저장한 AI 코스를 첫 글로 공유해보세요.',
    actionLabel: '첫 글 작성하기',
    actionTo: '/community/write',
    secondaryLabel: '게시판 보기',
    secondaryTo: '/community/boards',
  };
});

const selectedPost = computed(() => {
  if (!isPostDetail.value) return null;
  return uiStore.communityPosts.find((post) => String(post.id) === String(route.params.id)
    || String(post.postId) === String(route.params.id)) ?? null;
});

function postKey(post) {
  return post?.postId ?? post?.id;
}

function boardPostCount(board) {
  return uiStore.communityPosts.filter((post) => (post.tags ?? []).some((tag) => tag.includes(board.tag))).length;
}

function isPostLiked(post) {
  return Boolean(post?.isLiked || (uiStore.currentUser?.userId && (post.likedBy ?? []).includes(uiStore.currentUser.userId)));
}

function isPostScrapped(post) {
  return Boolean(uiStore.currentUser?.userId && (post.scrappedBy ?? []).includes(uiStore.currentUser.userId));
}

function isCommentOwner(comment) {
  return Boolean(uiStore.currentUser?.userId)
    && String(comment?.userId ?? '') === String(uiStore.currentUser.userId);
}

function commentKey(comment) {
  return comment?.commentId ?? comment?.id;
}

function linkedCourseTo(post) {
  return post?.routeId
    ? { name: 'course-detail', params: { routeId: post.routeId } }
    : '/ai/result';
}

async function createPost() {
  const created = await uiStore.createPost({
    title: title.value,
    body: body.value,
    tags: [activeBoard.value.tag, 'AI 코스'].filter(Boolean),
  });
  if (created) {
    title.value = '';
    body.value = '';
    router.push('/community');
  }
}

async function addComment(postId) {
  const created = await uiStore.addComment(postId, commentText.value);
  if (created) {
    commentText.value = '';
  }
}

function startEditComment(comment) {
  editingCommentId.value = commentKey(comment);
  editingCommentText.value = comment.text ?? '';
}

function cancelEditComment() {
  editingCommentId.value = '';
  editingCommentText.value = '';
}

async function saveEditedComment(postId) {
  if (!editingCommentId.value || commentActionLoading.value) return;
  if (!editingCommentText.value.trim()) {
    uiStore.notify('댓글 내용을 입력해 주세요.');
    return;
  }
  commentActionLoading.value = true;
  const updated = await uiStore.editComment(postId, editingCommentId.value, editingCommentText.value);
  commentActionLoading.value = false;
  if (updated) cancelEditComment();
}

async function deleteComment(postId, comment) {
  const targetId = commentKey(comment);
  if (!targetId || commentActionLoading.value) return;
  if (!window.confirm('댓글을 삭제할까요?')) return;
  commentActionLoading.value = true;
  const deleted = await uiStore.removeComment(postId, targetId);
  commentActionLoading.value = false;
  if (deleted && editingCommentId.value === targetId) cancelEditComment();
}

function clearQuery() {
  query.value = '';
}

function openShareSheet(post) {
  shareTarget.value = post;
}

function closeShareSheet() {
  shareTarget.value = null;
}

function shareUrl(post) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/community/post/${postKey(post)}`;
}

async function copyShareLink() {
  if (!shareTarget.value) return;
  const text = `${shareTarget.value.title}\n${shareUrl(shareTarget.value)}`;
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
    await navigator.clipboard.writeText(text);
    uiStore.notify('공유 링크를 복사했습니다.');
    closeShareSheet();
  } catch {
    uiStore.notify('이 환경에서는 링크 복사를 지원하지 않습니다.');
  }
}

async function nativeShare() {
  if (!shareTarget.value) return;
  const payload = {
    title: shareTarget.value.title,
    text: shareTarget.value.body,
    url: shareUrl(shareTarget.value),
  };

  if (!navigator.share) {
    await copyShareLink();
    return;
  }

  try {
    await navigator.share(payload);
    closeShareSheet();
  } catch (error) {
    if (error?.name !== 'AbortError') {
      uiStore.notify('공유를 완료하지 못했습니다. 링크 복사를 이용해 주세요.');
    }
  }
}
</script>

<template>
  <AppLayout :title="isPostDetail ? '게시글' : composeMode ? '커뮤니티' : ''" :back="isPostDetail || composeMode">
    <section class="community-screen">
      <template v-if="isBoardList">
        <SearchBar v-model="query" placeholder="게시글 / 태그 검색" @focus="router.push('/community/search')" />
        <div class="mode-toggle community-tabs" aria-label="Community sections">
          <RouterLink :class="{ active: activeMode === 'all' }" to="/community">전체</RouterLink>
          <RouterLink :class="{ active: activeMode === 'boards' }" to="/community/boards">게시판</RouterLink>
        </div>
        <p class="helper-text">관심 있는 K-content 카테고리를 선택해 실제 여행 후기와 코스를 확인하세요.</p>
        <div class="board-list">
          <RouterLink
            v-for="board in boards"
            :key="board.id"
            class="board-row"
            :to="{ name: 'community-drama-board', query: { board: board.id } }"
          >
            <span :class="['board-icon', `board-${board.id}`]" aria-hidden="true">
              <span class="board-icon-symbol">{{ board.icon }}</span>
            </span>
            <span class="board-copy">
              <strong>{{ board.name }}</strong>
              <small>{{ board.description }}</small>
            </span>
            <em>{{ boardPostCount(board) }}개</em>
            <span class="board-chevron" aria-hidden="true">›</span>
          </RouterLink>
        </div>
      </template>

      <template v-else-if="isPostDetail">
        <template v-if="selectedPost">
          <article class="post-detail-card">
            <div class="user-row">
              <b>{{ selectedPost.user }}</b>
              <span>{{ selectedPost.date }} · {{ selectedPost.region }}</span>
            </div>
            <h1>{{ selectedPost.title }}</h1>
            <p>{{ selectedPost.body }}</p>
            <div class="post-gallery" aria-label="Route image previews">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div v-if="selectedPost.attachments?.length" class="attachment-preview-list">
              <span v-for="attachment in selectedPost.attachments" :key="attachment.id">
                {{ attachment.type === 'video' ? '동영상' : '사진' }} · {{ attachment.name }}
              </span>
            </div>
            <div class="tag-row"><span v-for="tag in selectedPost.tags" :key="tag">{{ tag }}</span></div>
            <RouterLink class="linked-course" :to="linkedCourseTo(selectedPost)">
              <span class="course-dot">AI</span>
              <div>
                <small class="course-kicker">연결된 AI 코스</small>
                <strong>{{ selectedPost.region }} 감성 코스</strong>
                <small>{{ selectedPost.region }} · {{ selectedPost.duration }} · 검증 장소 기반</small>
              </div>
              <span class="linked-course-cta">보기</span>
            </RouterLink>
            <div class="feed-actions detail-actions">
              <button
                type="button"
                :class="{ 'is-active': isPostLiked(selectedPost) }"
                @click="uiStore.togglePostLike(postKey(selectedPost))"
              >
                <span class="action-icon">{{ isPostLiked(selectedPost) ? '♥' : '♡' }}</span>
                {{ selectedPost.likes }}
              </button>
              <a href="#community-comments">댓글 {{ selectedPost.comments?.length ?? 0 }}</a>
              <button
                type="button"
                :class="{ 'is-active': isPostScrapped(selectedPost) }"
                @click="uiStore.togglePostScrap(postKey(selectedPost))"
              >
                {{ isPostScrapped(selectedPost) ? '스크랩됨' : '스크랩' }}
              </button>
              <button type="button" @click="openShareSheet(selectedPost)">공유</button>
            </div>
          </article>

          <section id="community-comments" class="comments-panel">
            <h2>댓글 {{ selectedPost.comments?.length ?? 0 }}</h2>
            <div v-for="comment in selectedPost.comments" :key="commentKey(comment)" class="comment-row">
              <span class="comment-avatar">{{ comment.user?.slice(0, 1) || 'U' }}</span>
              <div>
                <div class="comment-meta">
                  <b>{{ comment.user }}</b>
                  <small>방금 전</small>
                </div>
                <template v-if="editingCommentId === commentKey(comment)">
                  <textarea
                    v-model="editingCommentText"
                    class="comment-edit-input"
                    maxlength="500"
                    placeholder="댓글 내용을 입력해 주세요."
                  ></textarea>
                  <div class="comment-row-actions">
                    <button
                      type="button"
                      :disabled="commentActionLoading || !editingCommentText.trim()"
                      @click="saveEditedComment(postKey(selectedPost))"
                    >
                      저장
                    </button>
                    <button type="button" :disabled="commentActionLoading" @click="cancelEditComment">취소</button>
                  </div>
                </template>
                <template v-else>
                  <p>{{ comment.text }}</p>
                  <div v-if="isCommentOwner(comment)" class="comment-row-actions">
                    <button type="button" @click="startEditComment(comment)">수정</button>
                    <button type="button" @click="deleteComment(postKey(selectedPost), comment)">삭제</button>
                  </div>
                </template>
              </div>
            </div>
            <EmptyState
              v-if="!selectedPost.comments?.length"
              icon="C"
              tone="community"
              compact
              title="첫 댓글을 기다리고 있어요"
              text="이 코스를 참고했다면 짧은 후기를 남겨보세요."
            />
            <div class="comment-box">
              <input v-model="commentText" placeholder="댓글을 입력하세요" @keyup.enter="addComment(postKey(selectedPost))" />
              <button type="button" :disabled="!commentText.trim()" @click="addComment(postKey(selectedPost))">등록</button>
            </div>
          </section>
        </template>
        <EmptyState
          v-else-if="uiStore.communityLoading"
          tone="loading"
          compact
          title="게시글을 불러오는 중입니다"
          text="커뮤니티 이야기를 확인하고 있어요."
        />
        <EmptyState
          v-else
          icon="!"
          tone="error"
          title="게시글을 찾을 수 없습니다"
          text="삭제되었거나 접근할 수 없는 글입니다."
          action-label="커뮤니티로 돌아가기"
          action-to="/community"
        />
      </template>

      <template v-else>
        <SearchBar v-model="query" placeholder="게시글 / 태그 검색" />
        <div class="mode-toggle community-tabs" aria-label="Community sections">
          <RouterLink :class="{ active: activeMode === 'all' }" to="/community">전체</RouterLink>
          <RouterLink :class="{ active: activeMode === 'boards' }" to="/community/boards">게시판</RouterLink>
        </div>

        <form v-if="composeMode" class="compose-card" @submit.prevent="createPost">
          <label class="form-field">제목<input v-model="title" placeholder="여행 후기 제목" /></label>
          <label class="form-field">내용<textarea v-model="body" placeholder="코스 경험을 공유해 주세요"></textarea></label>
          <BaseButton block>게시하기</BaseButton>
        </form>

        <div v-if="isBoardFeed" class="board-banner">
          <span :class="['board-icon', `board-${activeBoard.id}`]" aria-hidden="true">
            <span class="board-icon-symbol">{{ activeBoard.icon }}</span>
          </span>
          <div>
            <strong>{{ activeBoard.name }}</strong>
            <small>{{ activeBoard.description }}</small>
          </div>
        </div>

        <div class="feed-summary">
          <strong>{{ filteredPosts.length }}개의 이야기</strong>
        </div>

        <EmptyState
          v-if="uiStore.communityLoading"
          tone="loading"
          compact
          title="커뮤니티를 불러오는 중입니다"
          text="새로운 여행 이야기를 확인하고 있어요."
        />
        <EmptyState
          v-else-if="uiStore.communityError"
          icon="!"
          tone="error"
          compact
          title="커뮤니티를 불러오지 못했습니다"
          :text="uiStore.communityError"
          action-label="다시 시도"
          @action="loadCommunity"
        />

        <div v-else class="feed-list compact-feed-list">
          <article v-for="post in filteredPosts" :key="postKey(post)" class="feed-card route-story-card">
            <RouterLink class="feed-card-main" :to="`/community/post/${postKey(post)}`">
              <div class="feed-thumb">
                <span>{{ post.region?.slice(0, 2) || 'KR' }}</span>
              </div>
              <div class="feed-body">
                <div class="user-row"><b>{{ post.user }}</b><span>{{ post.date }}</span></div>
                <h2>{{ post.title }}</h2>
                <p>{{ post.body }}</p>
                <div class="tag-row"><span v-for="tag in post.tags" :key="tag">{{ tag }}</span></div>
              </div>
            </RouterLink>
            <div class="feed-actions compact-actions">
              <button
                type="button"
                :class="{ 'is-active': isPostLiked(post) }"
                @click="uiStore.togglePostLike(postKey(post))"
              >
                <span class="action-icon">{{ isPostLiked(post) ? '♥' : '♡' }}</span>
                {{ post.likes }}
              </button>
              <RouterLink :to="`/community/post/${postKey(post)}`">댓글 {{ post.comments?.length ?? 0 }}</RouterLink>
              <button
                type="button"
                :class="{ 'is-active': isPostScrapped(post) }"
                @click="uiStore.togglePostScrap(postKey(post))"
              >
                {{ isPostScrapped(post) ? '스크랩됨' : '스크랩' }}
              </button>
            </div>
          </article>
        </div>
        <EmptyState
          v-if="!uiStore.communityLoading && !uiStore.communityError && !filteredPosts.length"
          icon="C"
          tone="community"
          :title="feedEmptyState.title"
          :text="feedEmptyState.text"
          :action-label="feedEmptyState.actionLabel"
          :action-to="feedEmptyState.actionTo"
          :secondary-label="feedEmptyState.secondaryLabel"
          :secondary-to="feedEmptyState.secondaryTo"
          @action="clearQuery"
        />
        <RouterLink class="fab" to="/community/write" aria-label="Write post">+</RouterLink>
      </template>
    </section>

    <div v-if="shareTarget" class="sheet-backdrop" @click.self="closeShareSheet">
      <div class="bottom-sheet community-share-sheet" role="dialog" aria-modal="true" aria-label="게시글 공유">
        <div class="sheet-handle"></div>
        <h2>공유하기</h2>
        <p>{{ shareTarget.title }}</p>
        <div class="share-preview">
          <span>{{ shareTarget.region }}</span>
          <strong>{{ shareTarget.duration }} 코스 후기</strong>
        </div>
        <div class="share-options">
          <button type="button" @click="nativeShare">
            <span aria-hidden="true">↗</span>
            기기 공유
          </button>
          <button type="button" @click="copyShareLink">
            <span aria-hidden="true">⛓</span>
            링크 복사
          </button>
        </div>
        <BaseButton variant="secondary" block @click="closeShareSheet">닫기</BaseButton>
      </div>
    </div>
  </AppLayout>
</template>
