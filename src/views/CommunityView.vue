<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import SearchBar from '../components/common/SearchBar.vue';
import BaseButton from '../components/common/BaseButton.vue';
import EmptyState from '../components/common/EmptyState.vue';
import FormStatusNotice from '../components/common/FormStatusNotice.vue';
import SortSegmentedControl from '../components/common/SortSegmentedControl.vue';
import CommentThread from '../components/community/CommentThread.vue';
import CommunityPostDetailPanel from '../components/community/CommunityPostDetailPanel.vue';
import DetailNotFoundPanel from '../components/detail/DetailNotFoundPanel.vue';
import AuthorFollowCard from '../components/follow/AuthorFollowCard.vue';
import { useUiStore } from '../stores/uiStore.js';

const route = useRoute();
const router = useRouter();
const uiStore = useUiStore();
const query = ref('');
const sort = ref('latest');
const restoringQuery = ref(false);
const sortOptions = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
];
const visibleLimit = ref(8);
const title = ref('');
const body = ref('');
const commentText = ref('');
const editingCommentId = ref('');
const editingCommentText = ref('');
const replyTargetId = ref('');
const replyText = ref('');
const commentActionLoading = ref(false);
const commentNotice = ref(null);
const postActionLoading = ref(false);
const postNotice = ref(null);
const editingPost = ref(false);
const postEditTitle = ref('');
const postEditBody = ref('');
const showPostDeleteSheet = ref(false);
const shareTarget = ref(null);
const failedPostImageKeys = ref(new Set());

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
  const params = {
    sort: sort.value,
    size: 50,
    ...(isBoardFeed.value ? { board: activeBoard.value.id } : {}),
  };
  await uiStore.loadCommunityPosts(params);
  if (isPostDetail.value && route.params.id) {
    await uiStore.loadCommunityPost(route.params.id);
  }
  if (uiStore.currentUser) {
    await uiStore.loadFollowState();
  }
}

function queryValue(value, fallback = '') {
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

function positiveSize(value, fallback = 8) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 8 ? Math.min(50, parsed) : fallback;
}

function restoreQueryState() {
  restoringQuery.value = true;
  const routeSort = queryValue(route.query.sort, 'latest');
  query.value = queryValue(route.query.keyword);
  sort.value = ['latest', 'popular'].includes(routeSort) ? routeSort : 'latest';
  visibleLimit.value = positiveSize(route.query.size);
  queueMicrotask(() => {
    restoringQuery.value = false;
  });
}

function syncQueryState() {
  if (restoringQuery.value) return;
  router.replace({
    query: {
      ...route.query,
      keyword: query.value.trim() || undefined,
      sort: sort.value !== 'latest' ? sort.value : undefined,
      size: visibleLimit.value !== 8 ? String(visibleLimit.value) : undefined,
    },
  });
}

onMounted(() => {
  restoreQueryState();
  void loadCommunity();
});
watch(() => `${route.name ?? ''}:${route.params.id ?? ''}:${route.query.board ?? ''}`, loadCommunity);
watch(sort, () => {
  if (restoringQuery.value) return;
  visibleLimit.value = 8;
  syncQueryState();
  void loadCommunity();
});
watch(query, () => {
  if (restoringQuery.value) return;
  visibleLimit.value = 8;
  syncQueryState();
});
watch(visibleLimit, syncQueryState);

const filteredPosts = computed(() => {
  const normalizedQuery = query.value.trim().toLowerCase();
  return uiStore.communityPosts.filter((post) => {
    const haystack = `${post.title} ${post.body} ${(post.tags ?? []).join(' ')}`.toLowerCase();
    const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
    const matchesBoard = !isBoardFeed.value || (post.tags ?? []).some((tag) => tag.includes(activeBoard.value.tag));
    return matchesQuery && matchesBoard;
  });
});
const sortedPosts = computed(() => [...filteredPosts.value].sort((a, b) => {
  if (sort.value === 'popular') return Number(b.likes ?? b.likeCount ?? 0) - Number(a.likes ?? a.likeCount ?? 0);
  return String(b.date ?? b.createdAt ?? '').localeCompare(String(a.date ?? a.createdAt ?? ''), 'ko');
}));
const visiblePosts = computed(() => sortedPosts.value.slice(0, visibleLimit.value));
const hasMorePosts = computed(() => visiblePosts.value.length < sortedPosts.value.length);
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
const selectedComments = computed(() => selectedPost.value?.comments ?? []);
const selectedCommentIds = computed(() => new Set(selectedComments.value.map((comment) => String(commentKey(comment)))));
const selectedCommentCount = computed(() => selectedComments.value.length);
const expectedCommentCount = computed(() => postCommentCount(selectedPost.value));
const commentSectionLoading = computed(() => Boolean(selectedPost.value)
  && uiStore.communityLoading
  && expectedCommentCount.value > 0
  && selectedCommentCount.value === 0);
const commentSectionNeedsRetry = computed(() => Boolean(selectedPost.value)
  && !uiStore.communityLoading
  && expectedCommentCount.value > 0
  && selectedCommentCount.value === 0);
const topLevelComments = computed(() => selectedComments.value.filter((comment) => {
  const parentId = comment.parentCommentId;
  return !parentId || !selectedCommentIds.value.has(String(parentId));
}));

function postKey(post) {
  return post?.postId ?? post?.id;
}

function postCommentCount(post) {
  return Number(post?.commentCount ?? post?.commentsCount ?? post?.comments?.length ?? 0);
}

function focusCommentSection() {
  requestAnimationFrame(() => {
    const section = document.getElementById('community-comments');
    const input = section?.querySelector?.('.comment-box input');
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (uiStore.currentUser && input instanceof HTMLInputElement) {
      input.focus({ preventScroll: true });
    } else {
      section?.focus({ preventScroll: true });
    }
  });
}

async function retryCommentSection() {
  const targetPostId = postKey(selectedPost.value) || route.params.id;
  if (!targetPostId) return;
  commentNotice.value = null;
  await uiStore.loadCommunityPost(targetPostId);
  focusCommentSection();
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

function isPostLikePending(post) {
  const key = postKey(post);
  return uiStore.pendingPostLikes.some((id) => String(id) === String(key));
}

function isCommentOwner(comment) {
  return Boolean(uiStore.currentUser?.userId)
    && String(comment?.userId ?? '') === String(uiStore.currentUser.userId);
}

function isPostOwner(post) {
  return Boolean(uiStore.currentUser?.userId)
    && String(post?.userId ?? '') === String(uiStore.currentUser.userId);
}

function isCommentLiked(comment) {
  return Boolean(comment?.likedByMe || comment?.isLiked || comment?.liked);
}

function commentLikeCount(comment) {
  return Number(comment?.likeCount ?? comment?.likes ?? 0);
}

function isCommentLikePending(comment) {
  const key = commentKey(comment);
  return Boolean(key && uiStore.pendingCommentLikes.some((id) => String(id) === String(key)));
}

function commentLikeLabel(comment) {
  return isCommentLiked(comment) ? '댓글 좋아요 취소' : '댓글 좋아요';
}

function commentKey(comment) {
  return comment?.commentId ?? comment?.id;
}

function toggleCommentLike(comment) {
  const key = commentKey(comment);
  if (key) void uiStore.toggleCommentLike(key);
}

function repliesFor(comment) {
  const parentId = commentKey(comment);
  if (!parentId) return [];
  return selectedComments.value.filter((item) => String(item.parentCommentId ?? '') === String(parentId));
}

function formatDateOnly(date) {
  if (!date || Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function commentTimeLabel(comment) {
  const rawDate = comment?.createdAt ?? comment?.updatedAt ?? comment?.date;
  if (!rawDate) return '방금 전';

  const createdAt = new Date(rawDate);
  if (Number.isNaN(createdAt.getTime())) return comment?.date || '방금 전';

  const diffMs = Date.now() - createdAt.getTime();
  if (diffMs < 0) return formatDateOnly(createdAt) || comment?.date || '방금 전';

  const diffSeconds = Math.floor(diffMs / 1000);
  if (diffSeconds < 10) return '방금 전';
  if (diffSeconds < 60) return `${diffSeconds}초 전`;

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}분 전`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;

  return comment?.date || formatDateOnly(createdAt) || '방금 전';
}

function replyParentId(targetComment, threadParent = targetComment) {
  return targetComment?.parentCommentId || commentKey(threadParent) || commentKey(targetComment);
}

function replyPlaceholder(comment) {
  return `${comment?.user ?? '댓글 작성자'}에게 답글을 입력하세요`;
}

function linkedCourseTo(post) {
  return post?.routeId
    ? { name: 'course-detail', params: { routeId: post.routeId } }
    : '/ai/result';
}

function hasLinkedCourse(post) {
  return Boolean(post?.routeId);
}

function attachmentImageUrl(attachment) {
  return attachment?.url
    ?? attachment?.imageUrl
    ?? attachment?.image_url
    ?? attachment?.fileUrl
    ?? attachment?.file_url
    ?? attachment?.previewUrl
    ?? attachment?.preview_url
    ?? attachment?.thumbnailUrl
    ?? attachment?.thumbnail_url
    ?? '';
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
  ].filter(Boolean);
  const attachmentImages = (post?.attachments ?? [])
    .map(attachmentImageUrl)
    .filter(Boolean);
  return [...directImages, ...attachmentImages]
    .filter((image) => !failedPostImageKeys.value.has(postImageFailureKey(post, image)))
    .slice(0, 3);
}

function postImageFailureKey(post, image) {
  return `${postKey(post) || 'post'}::${image}`;
}

function markPostImageFailed(post, image) {
  const next = new Set(failedPostImageKeys.value);
  next.add(postImageFailureKey(post, image));
  failedPostImageKeys.value = next;
}

function canShowAuthorFollow(post) {
  const authorId = post?.userId;
  if (!authorId) return false;
  return !uiStore.currentUser?.userId || String(authorId) !== String(uiStore.currentUser.userId);
}

function isAuthorFollowed(post) {
  const authorId = post?.userId;
  return Boolean(authorId && uiStore.followingIds.some((id) => String(id) === String(authorId)));
}

function isAuthorFollowLoading(post) {
  const authorId = post?.userId;
  return Boolean(authorId && uiStore.followActionLoadingIds.some((id) => String(id) === String(authorId)));
}

async function toggleAuthorFollow(post) {
  if (!post?.userId) return;
  if (isAuthorFollowed(post)) await uiStore.unfollowUser(post.userId);
  else await uiStore.followUser(post.userId);
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

function startPostEdit() {
  if (!selectedPost.value) return;
  editingPost.value = true;
  postEditTitle.value = selectedPost.value.title ?? '';
  postEditBody.value = selectedPost.value.body ?? '';
  postNotice.value = {
    tone: 'info',
    title: '게시글 수정',
    text: '제목과 내용을 수정한 뒤 저장을 눌러 주세요.',
  };
}

function cancelPostEdit() {
  editingPost.value = false;
  postEditTitle.value = '';
  postEditBody.value = '';
}

async function savePostEdit() {
  const target = selectedPost.value;
  if (!target || postActionLoading.value) return;
  if (postEditTitle.value.trim().length < 2 || postEditBody.value.trim().length < 5) {
    postNotice.value = {
      tone: 'warning',
      title: '입력 내용을 확인해 주세요.',
      text: '제목은 2자 이상, 내용은 5자 이상 입력해야 수정할 수 있습니다.',
    };
    return;
  }
  postActionLoading.value = true;
  postNotice.value = {
    tone: 'info',
    title: '게시글을 수정하는 중입니다.',
    text: '수정 내용을 backend에 저장하고 있습니다.',
  };
  const updated = await uiStore.editPost(postKey(target), {
    title: postEditTitle.value.trim(),
    body: postEditBody.value.trim(),
    tags: target.tags ?? [],
    region: target.region,
    duration: target.duration,
    routeId: target.routeId,
    prefix: target.prefix,
    attachments: target.attachments ?? [],
  });
  postActionLoading.value = false;
  if (updated) {
    cancelPostEdit();
    postNotice.value = {
      tone: 'success',
      title: '수정되었습니다.',
      text: '게시글 제목과 내용이 업데이트되었습니다.',
    };
    return;
  }
  postNotice.value = {
    tone: 'error',
    title: '게시글을 수정하지 못했습니다.',
    text: uiStore.communityError || '권한 또는 로그인 상태를 확인해 주세요.',
  };
}

async function deletePost() {
  const target = selectedPost.value;
  if (!target || postActionLoading.value) return;
  postActionLoading.value = true;
  postNotice.value = {
    tone: 'info',
    title: '게시글을 삭제하는 중입니다.',
    text: '작성한 게시글을 삭제하고 커뮤니티 목록을 갱신하고 있습니다.',
  };
  const deleted = await uiStore.removePost(postKey(target));
  postActionLoading.value = false;
  showPostDeleteSheet.value = false;
  if (deleted) {
    postNotice.value = {
      tone: 'success',
      title: '삭제되었습니다.',
      text: '게시글이 커뮤니티에서 제거되었습니다.',
    };
    window.setTimeout(() => router.replace('/community'), 450);
    return;
  }
  postNotice.value = {
    tone: 'error',
    title: '게시글을 삭제하지 못했습니다.',
    text: uiStore.communityError || '권한 또는 로그인 상태를 확인해 주세요.',
  };
}

async function addComment(postId) {
  if (!commentText.value.trim()) {
    commentNotice.value = {
      tone: 'warning',
      title: '댓글 내용을 입력해 주세요.',
      text: '댓글은 한 글자 이상 입력해야 등록할 수 있습니다.',
    };
    uiStore.notify('댓글 내용을 입력해 주세요.');
    return;
  }
  commentNotice.value = {
    tone: 'info',
    title: '댓글을 등록하는 중입니다.',
    text: '작성한 댓글을 backend에 저장하고 있습니다.',
  };
  const created = await uiStore.addComment(postId, commentText.value);
  if (created) {
    commentText.value = '';
    commentNotice.value = null;
    return;
  }
  commentNotice.value = {
    tone: 'error',
    title: '댓글을 등록하지 못했습니다.',
    text: uiStore.communityError || '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.',
  };
}

function startReply(comment) {
  replyTargetId.value = commentKey(comment);
  replyText.value = '';
}

function cancelReply() {
  replyTargetId.value = '';
  replyText.value = '';
}

async function addReply(postId, comment, threadParent = comment) {
  const parentId = replyParentId(comment, threadParent);
  if (!parentId || commentActionLoading.value) return;
  if (!replyText.value.trim()) {
    commentNotice.value = {
      tone: 'warning',
      title: '댓글 내용을 입력해 주세요.',
      text: '답글은 한 글자 이상 입력해야 등록할 수 있습니다.',
    };
    uiStore.notify('댓글 내용을 입력해 주세요.');
    return;
  }
  commentActionLoading.value = true;
  commentNotice.value = {
    tone: 'info',
    title: '답글을 등록하는 중입니다.',
    text: '선택한 댓글의 답글로 저장하고 있습니다.',
  };
  const created = await uiStore.addComment(postId, replyText.value, parentId);
  commentActionLoading.value = false;
  if (created) {
    cancelReply();
    commentNotice.value = null;
    return;
  }
  commentNotice.value = {
    tone: 'error',
    title: '답글을 등록하지 못했습니다.',
    text: uiStore.communityError || '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.',
  };
}

function startEditComment(comment) {
  editingCommentId.value = commentKey(comment);
  editingCommentText.value = comment.text ?? '';
  commentNotice.value = {
    tone: 'info',
    title: '댓글 수정',
    text: '내용을 수정한 뒤 저장을 눌러 주세요.',
  };
}

function cancelEditComment() {
  editingCommentId.value = '';
  editingCommentText.value = '';
}

async function saveEditedComment(postId) {
  if (!editingCommentId.value || commentActionLoading.value) return;
  if (!editingCommentText.value.trim()) {
    commentNotice.value = {
      tone: 'warning',
      title: '댓글 내용을 입력해 주세요.',
      text: '수정할 댓글 내용은 비워둘 수 없습니다.',
    };
    uiStore.notify('댓글 내용을 입력해 주세요.');
    return;
  }
  commentActionLoading.value = true;
  commentNotice.value = {
    tone: 'info',
    title: '댓글을 수정하는 중입니다.',
    text: '수정 내용을 backend에 저장하고 있습니다.',
  };
  const updated = await uiStore.editComment(postId, editingCommentId.value, editingCommentText.value);
  commentActionLoading.value = false;
  if (updated) {
    cancelEditComment();
    commentNotice.value = null;
    return;
  }
  commentNotice.value = {
    tone: 'error',
    title: '댓글을 수정하지 못했습니다.',
    text: uiStore.communityError || '권한 또는 로그인 상태를 확인해 주세요.',
  };
}

async function deleteComment(postId, comment) {
  const targetId = commentKey(comment);
  if (!targetId || commentActionLoading.value) return;
  commentActionLoading.value = true;
  commentNotice.value = {
    tone: 'info',
    title: '댓글을 삭제하는 중입니다.',
    text: '선택한 댓글을 삭제하고 목록을 갱신하고 있습니다.',
  };
  const deleted = await uiStore.removeComment(postId, targetId);
  commentActionLoading.value = false;
  if (deleted) {
    if (editingCommentId.value === targetId) cancelEditComment();
    commentNotice.value = null;
    return;
  }
  commentNotice.value = {
    tone: 'error',
    title: '댓글을 삭제하지 못했습니다.',
    text: uiStore.communityError || '권한 또는 로그인 상태를 확인해 주세요.',
  };
}

function clearQuery() {
  query.value = '';
}

function loadMorePosts() {
  visibleLimit.value += 8;
}

const canFollowSelectedAuthor = computed(() => canShowAuthorFollow(selectedPost.value));
const selectedAuthorFollowed = computed(() => isAuthorFollowed(selectedPost.value));
const selectedAuthorFollowLoading = computed(() => isAuthorFollowLoading(selectedPost.value));

async function toggleSelectedAuthorFollow() {
  await toggleAuthorFollow(selectedPost.value);
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
        <SearchBar v-model="query" placeholder="게시글, 태그 검색" @focus="router.push('/community/search')" />
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
        <CommunityPostDetailPanel v-if="selectedPost">
          <article class="post-detail-card">
            <div class="post-detail-topline">
              <AuthorFollowCard
                class="post-detail-author"
                :author-name="selectedPost.user"
                :meta="`${selectedPost.date} · ${selectedPost.region}`"
                :can-follow="canFollowSelectedAuthor"
                :following="selectedAuthorFollowed"
                :loading="selectedAuthorFollowLoading"
                @toggle="toggleSelectedAuthorFollow"
              />
              <div v-if="isPostOwner(selectedPost) && !editingPost" class="post-owner-actions post-owner-actions--compact">
                <BaseButton class="post-owner-button" variant="secondary" @click="startPostEdit">수정</BaseButton>
                <BaseButton class="post-owner-button" variant="danger" @click="showPostDeleteSheet = true">삭제</BaseButton>
              </div>
            </div>
            <FormStatusNotice
              v-if="postNotice"
              compact
              :tone="postNotice.tone"
              :title="postNotice.title"
              :text="postNotice.text"
            />
            <template v-if="editingPost">
              <label class="form-field compact">
                제목
                <input v-model="postEditTitle" maxlength="50" placeholder="게시글 제목" />
              </label>
              <label class="form-field compact">
                내용
                <textarea v-model="postEditBody" maxlength="500" placeholder="게시글 내용을 입력해 주세요."></textarea>
              </label>
              <div class="post-owner-actions">
                <BaseButton :disabled="postActionLoading || postEditTitle.trim().length < 2 || postEditBody.trim().length < 5" @click="savePostEdit">
                  {{ postActionLoading ? '저장 중...' : '수정 저장' }}
                </BaseButton>
                <BaseButton variant="secondary" :disabled="postActionLoading" @click="cancelPostEdit">취소</BaseButton>
              </div>
            </template>
            <template v-else>
              <h1>{{ selectedPost.title }}</h1>
              <p>{{ selectedPost.body }}</p>
            </template>
            <div v-if="postImageSources(selectedPost).length" class="post-gallery" aria-label="게시글 이미지 미리보기">
              <img
                v-for="(image, index) in postImageSources(selectedPost)"
                :key="`post-image-${index}-${image}`"
                :src="image"
                alt=""
                @error="markPostImageFailed(selectedPost, image)"
              />
            </div>
            <div v-if="selectedPost.attachments?.length" class="attachment-preview-list">
              <span v-for="attachment in selectedPost.attachments" :key="attachment.id">
                {{ attachment.type === 'video' ? '동영상' : '사진' }} · {{ attachment.name }}
              </span>
            </div>
            <div class="tag-row"><span v-for="tag in selectedPost.tags" :key="tag">{{ tag }}</span></div>
            <RouterLink v-if="hasLinkedCourse(selectedPost)" class="linked-course" :to="linkedCourseTo(selectedPost)">
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
                :aria-pressed="isPostLiked(selectedPost)"
                :disabled="isPostLikePending(selectedPost)"
                @click="uiStore.togglePostLike(postKey(selectedPost))"
              >
                <span class="action-icon">{{ isPostLiked(selectedPost) ? '♥' : '♡' }}</span>
                {{ selectedPost.likes }}
              </button>
              <a href="#community-comments" @click.prevent="focusCommentSection">댓글 {{ selectedCommentCount }}</a>
              <button
                type="button"
                :class="{ 'is-active': isPostScrapped(selectedPost) }"
                @click="uiStore.togglePostScrap(postKey(selectedPost))"
              >
                {{ isPostScrapped(selectedPost) ? '스크랩됨' : '스크랩' }}
              </button>
              <button type="button" @click="openShareSheet(selectedPost)">공유</button>
            </div>
            <div v-if="showPostDeleteSheet" class="sheet-backdrop" @click="showPostDeleteSheet = false">
              <div class="bottom-sheet delete-course-sheet" role="dialog" aria-modal="true" aria-label="게시글 삭제" @click.stop>
                <div class="sheet-handle"></div>
                <h2>게시글을 삭제할까요?</h2>
                <p>삭제하면 커뮤니티 목록과 내 게시글 목록에서 사라집니다. 댓글도 함께 보이지 않게 됩니다.</p>
                <div class="sheet-actions two">
                  <BaseButton variant="secondary" :disabled="postActionLoading" @click="showPostDeleteSheet = false">취소</BaseButton>
                  <BaseButton variant="danger" :disabled="postActionLoading" @click="deletePost">
                    {{ postActionLoading ? '삭제 중...' : '삭제' }}
                  </BaseButton>
                </div>
              </div>
            </div>
          </article>

          <CommentThread :count="selectedCommentCount">
            <FormStatusNotice
              v-if="commentNotice"
              compact
              :tone="commentNotice.tone"
              :title="commentNotice.title"
              :text="commentNotice.text"
            />
            <EmptyState
              v-if="commentSectionLoading"
              tone="loading"
              compact
              title="댓글을 불러오는 중입니다"
              text="게시글에 연결된 댓글 목록을 확인하고 있어요."
            />
            <EmptyState
              v-else-if="commentSectionNeedsRetry"
              icon="!"
              tone="error"
              compact
              title="댓글 목록을 다시 불러와야 합니다"
              :text="uiStore.communityError || '댓글 수와 실제 댓글 목록이 맞지 않아 다시 조회가 필요합니다.'"
              action-label="댓글 다시 불러오기"
              @action="retryCommentSection"
            />
            <template v-if="!commentSectionLoading && !commentSectionNeedsRetry">
              <div
                v-for="comment in topLevelComments"
                :key="commentKey(comment)"
                class="comment-thread"
              >
                <div class="comment-row">
                  <span class="comment-avatar">{{ comment.user?.slice(0, 1) || 'U' }}</span>
                  <div class="comment-content">
                    <div class="comment-header">
                      <div class="comment-meta">
                        <b>{{ comment.user }}</b>
                        <small>{{ commentTimeLabel(comment) }}</small>
                      </div>
                      <button
                        type="button"
                        class="comment-heart-button"
                        :class="{ 'is-active': isCommentLiked(comment) }"
                        :aria-pressed="isCommentLiked(comment)"
                        :aria-label="commentLikeLabel(comment)"
                        :disabled="isCommentLikePending(comment)"
                        @click="toggleCommentLike(comment)"
                      >
                        <span class="action-icon" aria-hidden="true">{{ isCommentLiked(comment) ? '♥' : '♡' }}</span>
                        <span v-if="commentLikeCount(comment)" class="comment-heart-count">{{ commentLikeCount(comment) }}</span>
                      </button>
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
                          class="comment-action-button is-primary"
                          :disabled="commentActionLoading || !editingCommentText.trim()"
                          @click="saveEditedComment(postKey(selectedPost))"
                        >
                          저장
                        </button>
                        <button type="button" class="comment-action-button" :disabled="commentActionLoading" @click="cancelEditComment">취소</button>
                      </div>
                    </template>
                    <template v-else>
                      <p>{{ comment.text }}</p>
                      <div class="comment-row-actions">
                        <button
                          type="button"
                          class="comment-action-button"
                          :aria-label="`${comment.user}에게 답글 작성`"
                          @click="startReply(comment)"
                        >
                          답글
                        </button>
                        <button
                          v-if="isCommentOwner(comment)"
                          type="button"
                          class="comment-action-button"
                          :disabled="commentActionLoading"
                          :aria-label="`${comment.user} 댓글 수정`"
                          @click="startEditComment(comment)"
                        >
                          수정
                        </button>
                        <button
                          v-if="isCommentOwner(comment)"
                          type="button"
                          class="comment-action-button is-danger"
                          :disabled="commentActionLoading"
                          :aria-label="`${comment.user} 댓글 삭제`"
                          @click="deleteComment(postKey(selectedPost), comment)"
                        >
                          삭제
                        </button>
                      </div>
                      <div v-if="replyTargetId === commentKey(comment)" class="comment-reply-box">
                        <input
                          v-model="replyText"
                          :placeholder="replyPlaceholder(comment)"
                          @keyup.enter="addReply(postKey(selectedPost), comment)"
                        />
                        <button
                          type="button"
                          :disabled="commentActionLoading || !replyText.trim()"
                          @click="addReply(postKey(selectedPost), comment)"
                        >
                          등록
                        </button>
                        <button type="button" :disabled="commentActionLoading" @click="cancelReply">취소</button>
                      </div>
                    </template>
                  </div>
                </div>

                <div v-if="repliesFor(comment).length" class="reply-thread">
                  <div
                    v-for="reply in repliesFor(comment)"
                    :key="commentKey(reply)"
                    class="comment-row comment-row--reply"
                  >
                    <span class="comment-avatar comment-avatar--reply">{{ reply.user?.slice(0, 1) || 'U' }}</span>
                    <div class="comment-content">
                      <div class="comment-header">
                        <div class="comment-meta">
                          <b>{{ reply.user }}</b>
                          <small>{{ commentTimeLabel(reply) }}</small>
                        </div>
                        <button
                          type="button"
                          class="comment-heart-button"
                          :class="{ 'is-active': isCommentLiked(reply) }"
                          :aria-pressed="isCommentLiked(reply)"
                          :aria-label="commentLikeLabel(reply)"
                          :disabled="isCommentLikePending(reply)"
                          @click="toggleCommentLike(reply)"
                        >
                          <span class="action-icon" aria-hidden="true">{{ isCommentLiked(reply) ? '♥' : '♡' }}</span>
                          <span v-if="commentLikeCount(reply)" class="comment-heart-count">{{ commentLikeCount(reply) }}</span>
                        </button>
                      </div>
                      <template v-if="editingCommentId === commentKey(reply)">
                        <textarea
                          v-model="editingCommentText"
                          class="comment-edit-input"
                          maxlength="500"
                          placeholder="댓글 내용을 입력해 주세요."
                        ></textarea>
                        <div class="comment-row-actions">
                          <button
                            type="button"
                            class="comment-action-button is-primary"
                            :disabled="commentActionLoading || !editingCommentText.trim()"
                            @click="saveEditedComment(postKey(selectedPost))"
                          >
                            저장
                          </button>
                          <button type="button" class="comment-action-button" :disabled="commentActionLoading" @click="cancelEditComment">취소</button>
                        </div>
                      </template>
                      <template v-else>
                        <p>{{ reply.text }}</p>
                        <div class="comment-row-actions">
                          <button
                            type="button"
                            class="comment-action-button"
                            :aria-label="`${reply.user}에게 답글 작성`"
                            @click="startReply(reply)"
                          >
                            답글
                          </button>
                          <button
                            v-if="isCommentOwner(reply)"
                            type="button"
                            class="comment-action-button"
                            :disabled="commentActionLoading"
                            :aria-label="`${reply.user} 답글 수정`"
                            @click="startEditComment(reply)"
                          >
                            수정
                          </button>
                          <button
                            v-if="isCommentOwner(reply)"
                            type="button"
                            class="comment-action-button is-danger"
                            :disabled="commentActionLoading"
                            :aria-label="`${reply.user} 답글 삭제`"
                            @click="deleteComment(postKey(selectedPost), reply)"
                          >
                            삭제
                          </button>
                        </div>
                        <div v-if="replyTargetId === commentKey(reply)" class="comment-reply-box comment-reply-box--reply">
                          <input
                            v-model="replyText"
                            :placeholder="replyPlaceholder(reply)"
                            @keyup.enter="addReply(postKey(selectedPost), reply, comment)"
                          />
                          <button
                            type="button"
                            :disabled="commentActionLoading || !replyText.trim()"
                            @click="addReply(postKey(selectedPost), reply, comment)"
                          >
                            등록
                          </button>
                          <button type="button" :disabled="commentActionLoading" @click="cancelReply">취소</button>
                        </div>
                      </template>
                    </div>
                  </div>
                </div>
              </div>
            </template>
            <EmptyState
              v-if="!selectedComments.length && !commentSectionLoading && !commentSectionNeedsRetry"
              icon="C"
              tone="community"
              compact
              title="첫 댓글을 기다리고 있어요"
              text="이 코스를 참고했다면 짧은 후기를 남겨보세요."
            />
            <div v-if="uiStore.currentUser" class="comment-box">
              <input v-model="commentText" placeholder="댓글을 입력하세요" @keyup.enter="addComment(postKey(selectedPost))" />
              <button type="button" :disabled="!commentText.trim()" @click="addComment(postKey(selectedPost))">등록</button>
            </div>
            <EmptyState
              v-else
              icon="L"
              tone="login"
              compact
              title="로그인하면 댓글을 남길 수 있어요"
              text="여행 후기와 촬영지 이야기에 댓글로 함께 참여해 보세요."
              action-label="로그인하기"
              action-to="/login"
            />
          </CommentThread>
        </CommunityPostDetailPanel>
        <EmptyState
          v-else-if="uiStore.communityLoading"
          tone="loading"
          compact
          title="게시글을 불러오는 중입니다"
          text="커뮤니티 이야기를 확인하고 있어요."
        />
        <DetailNotFoundPanel
          v-else
          title="게시글을 찾을 수 없습니다"
          text="삭제되었거나 접근할 수 없는 글입니다."
          list-label="커뮤니티로 돌아가기"
          list-to="/community"
          @retry="loadCommunity"
        />
      </template>

      <template v-else>
        <SearchBar v-model="query" placeholder="게시글, 태그 검색" />
        <div class="mode-toggle community-tabs" aria-label="Community sections">
          <RouterLink :class="{ active: activeMode === 'all' }" to="/community">전체</RouterLink>
          <RouterLink :class="{ active: activeMode === 'boards' }" to="/community/boards">게시판</RouterLink>
        </div>
        <div class="list-control-row community-sort-row" aria-label="커뮤니티 정렬과 결과 수">
          <span class="list-control-label">정렬</span>
          <SortSegmentedControl
            v-model="sort"
            :options="sortOptions"
            aria-label="커뮤니티 글 정렬"
          />
          <span class="list-result-count" aria-live="polite">{{ sortedPosts.length }}개 결과</span>
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
          <strong>{{ sortedPosts.length }}개의 이야기</strong>
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
          <article v-for="post in visiblePosts" :key="postKey(post)" class="feed-card route-story-card">
            <div class="feed-card-author-row">
              <div class="user-row feed-author-copy">
                <b>{{ post.user }}</b>
                <span>{{ post.date }}</span>
              </div>
              <button
                v-if="canShowAuthorFollow(post)"
                type="button"
                class="author-follow-button author-follow-button--compact"
                :class="{ 'is-following': isAuthorFollowed(post) }"
                :aria-pressed="isAuthorFollowed(post)"
                :disabled="isAuthorFollowLoading(post)"
                @click="toggleAuthorFollow(post)"
              >
                {{ isAuthorFollowLoading(post) ? '처리 중' : isAuthorFollowed(post) ? '팔로잉' : '팔로우' }}
              </button>
            </div>
            <RouterLink
              class="feed-card-main"
              :class="{ 'feed-card-main--text-only': !postImageSources(post).length }"
              :to="`/community/post/${postKey(post)}`"
            >
              <div v-if="postImageSources(post).length" class="feed-thumb feed-thumb--image">
                <img :src="postImageSources(post)[0]" alt="" @error="markPostImageFailed(post, postImageSources(post)[0])" />
              </div>
              <div class="feed-body">
                <h2>{{ post.title }}</h2>
                <p>{{ post.body }}</p>
                <div class="tag-row"><span v-for="tag in post.tags" :key="tag">{{ tag }}</span></div>
              </div>
            </RouterLink>
            <div class="feed-actions compact-actions">
              <button
                type="button"
                :class="{ 'is-active': isPostLiked(post) }"
                :aria-pressed="isPostLiked(post)"
                :disabled="isPostLikePending(post)"
                @click="uiStore.togglePostLike(postKey(post))"
              >
                <span class="action-icon">{{ isPostLiked(post) ? '♥' : '♡' }}</span>
                {{ post.likes }}
              </button>
              <RouterLink :to="`/community/post/${postKey(post)}`">댓글 {{ postCommentCount(post) }}</RouterLink>
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
        <div v-if="hasMorePosts" class="load-more-row">
          <button type="button" @click="loadMorePosts">더 보기</button>
        </div>
        <EmptyState
          v-if="!uiStore.communityLoading && !uiStore.communityError && !sortedPosts.length"
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
