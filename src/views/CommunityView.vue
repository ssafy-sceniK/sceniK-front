<script setup>
import { useI18n } from 'vue-i18n';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
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
import TranslatableText from '../components/translation/TranslatableText.vue';
import { uploadPostImage } from '../api/communityApi.js';
import { resolveApiAssetUrl } from '../api/http.js';
import { useUiStore } from '../stores/uiStore.js';
import {
  attachmentName,
  attachmentUrl,
  buildEditableAttachments,
  displayableImageAttachments,
  fallbackFileAttachments,
  isDisplayableImageAttachment,
  moveArrayItem,
} from '../utils/communityAttachments.js';
import { filterGenericAiCourseTags, isGenericAiCourseTag } from '../utils/tags.js';

const route = useRoute();
const router = useRouter();
const uiStore = useUiStore();
const { t } = useI18n();
const query = ref('');
const sort = ref('latest');
const restoringQuery = ref(false);
const sortOptions = computed(() => [
  { value: 'latest', label: t('communityAuto.k16lgll3') },
  { value: 'popular', label: t('communityAuto.k88cncb') },
]);
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
const postEditBoard = ref('drama');
const postEditHashtags = ref([]);
const postEditImageItems = ref([]);
const showPostDeleteSheet = ref(false);
const shareTarget = ref(null);
const failedPostImageKeys = ref(new Set());
const boardSelectorOpen = ref(false);
const postEditHashtagInput = ref('');
const imageViewerPost = ref(null);
const imageViewerIndex = ref(0);

const MAX_HASHTAGS = 10;
const MAX_POST_IMAGES = 10;

const boards = computed(() => [
  { id: 'drama', icon: 'DR', name: t('community.boardLabels.drama.short'), fullName: t('community.boardLabels.drama.full'), description: t('communityAuto.koyw4yb'), tag: '\ub4dc\ub77c\ub9c8' },
  { id: 'movie', icon: 'MV', name: t('community.boardLabels.movie.short'), fullName: t('community.boardLabels.movie.full'), description: t('communityAuto.k16vm9dk'), tag: '\uc601\ud654' },
  { id: 'idol', icon: 'ID', name: t('community.boardLabels.idol.short'), fullName: t('community.boardLabels.idol.full'), description: t('communityAuto.k1mwcls6'), tag: '\uc544\uc774\ub3cc' },
  { id: 'variety', icon: 'TV', name: t('community.boardLabels.variety.short'), fullName: t('community.boardLabels.variety.full'), description: t('communityAuto.k1gtppnx'), tag: '\uc608\ub2a5' },
  { id: 'region', icon: 'RG', name: t('community.boardLabels.region.short'), fullName: t('community.boardLabels.region.full'), description: t('communityAuto.k2glxru'), tag: '\uc9c0\uc5ed' },
]);

const isBoardList = computed(() => route.name === 'community-boards');
const isBoardFeed = computed(() => route.name === 'community-drama-board');
const isPostDetail = computed(() => route.name === 'community-post');
const composeMode = computed(() => route.meta.compose);
const activeBoard = computed(() => boards.value.find((board) => board.id === route.query.board) ?? boards.value[0]);
const activeMode = computed(() => (isBoardList.value || isBoardFeed.value ? 'boards' : 'all'));
const otherBoards = computed(() => boards.value.filter((board) => board.id !== activeBoard.value.id));

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
  document.addEventListener('pointerdown', handleBoardSelectorPointerDown);
  document.addEventListener('keydown', handleImageViewerKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleBoardSelectorPointerDown);
  document.removeEventListener('keydown', handleImageViewerKeydown);
  if (editingPost.value) resetPostEditState();
});
watch(() => `${route.name ?? ''}:${route.params.id ?? ''}:${route.query.board ?? ''}`, loadCommunity);
watch(() => `${route.name ?? ''}:${route.params.id ?? ''}`, (nextRouteKey, previousRouteKey) => {
  if (editingPost.value && nextRouteKey !== previousRouteKey) resetPostEditState();
});
watch(() => route.query.board, () => {
  boardSelectorOpen.value = false;
});
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
      title: t('communityAuto2.k8'),
      text: t('communityAuto2.k9'),
      actionLabel: t('communityAuto2.ka'),
      actionTo: '',
      secondaryLabel: t('communityAuto2.kb'),
      secondaryTo: '/community/write',
    };
  }

  if (isBoardFeed.value) {
    return {
      title: t('communityAuto2.k1r', { board: activeBoard.value.name }),
      text: t('communityAuto2.kc'),
      actionLabel: t('communityAuto2.kd'),
      actionTo: '/community/write',
      secondaryLabel: t('communityAuto2.ke'),
      secondaryTo: '/community/boards',
    };
  }

  return {
    title: t('communityAuto2.kf'),
    text: t('communityAuto2.kg'),
    actionLabel: t('communityAuto2.kd'),
    actionTo: '/community/write',
    secondaryLabel: t('communityAuto2.ke'),
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
const imageViewerImages = computed(() => (imageViewerPost.value ? postImageSources(imageViewerPost.value) : []));
const imageViewerImage = computed(() => imageViewerImages.value[imageViewerIndex.value] ?? '');

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

function toggleBoardSelector() {
  boardSelectorOpen.value = !boardSelectorOpen.value;
}

function handleBoardSelectorPointerDown(event) {
  if (!boardSelectorOpen.value || !(event.target instanceof Element)) return;
  if (!event.target.closest('.board-selector')) boardSelectorOpen.value = false;
}

function selectBoard(board) {
  boardSelectorOpen.value = false;
  router.push({
    name: 'community-drama-board',
    query: {
      ...route.query,
      board: board.id,
      sort: sort.value !== 'latest' ? sort.value : undefined,
      size: undefined,
    },
  });
}
function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeHashtag(value) {
  return String(value ?? '').trim().replace(/^#+/, '').replace(/[\s,]+$/g, '').trim();
}

function hashtagText(rawValue, fallbackValue) {
  return typeof rawValue === 'string' ? rawValue : fallbackValue;
}

function isBoardTag(tag) {
  return boards.value.some((board) => board.tag === tag);
}

function isSystemPostTag(tag) {
  return isBoardTag(tag) || isGenericAiCourseTag(tag);
}

function addPostEditHashtag(rawValue = postEditHashtagInput.value) {
  const tag = normalizeHashtag(hashtagText(rawValue, postEditHashtagInput.value));
  postEditHashtagInput.value = '';
  if (!tag || postEditHashtags.value.includes(tag)) return;
  if (postEditHashtags.value.length >= MAX_HASHTAGS) {
    postNotice.value = {
      tone: 'warning',
      title: t('communityAuto2.kh'),
      text: t('communityAuto2.ki'),
    };
    return;
  }
  postEditHashtags.value = [...postEditHashtags.value, tag];
}

function handlePostEditHashtagKeydown(event) {
  if (event.key === 'Enter' || event.key === ',' || event.key === ' ') {
    event.preventDefault();
    addPostEditHashtag();
  }
}

function removePostEditHashtag(tag) {
  postEditHashtags.value = postEditHashtags.value.filter((item) => item !== tag);
}

function buildPostEditTags() {
  return uniqueValues([
    boards.value.find((board) => board.id === postEditBoard.value)?.tag,
    ...postEditHashtags.value,
  ]);
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
  return isCommentLiked(comment) ? t('communityAuto2.kk') : t('communityAuto2.kl');
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
  if (!rawDate) return t('communityAuto.k15o4n14');

  const createdAt = new Date(rawDate);
  if (Number.isNaN(createdAt.getTime())) return comment?.date || t('communityAuto.k15o4n14');

  const diffMs = Date.now() - createdAt.getTime();
  if (diffMs < 0) return formatDateOnly(createdAt) || comment?.date || t('communityAuto.k15o4n14');

  const diffSeconds = Math.floor(diffMs / 1000);
  if (diffSeconds < 10) return t('communityAuto.k15o4n14');
  if (diffSeconds < 60) return t('communityAuto2.k2', { count: diffSeconds });

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return t('communityAuto2.k3', { count: diffMinutes });

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return t('communityAuto2.k4', { count: diffHours });

  return comment?.date || formatDateOnly(createdAt) || t('communityAuto.k15o4n14');
}

function replyParentId(targetComment, threadParent = targetComment) {
  return targetComment?.parentCommentId || commentKey(threadParent) || commentKey(targetComment);
}

function replyPlaceholder(comment) {
  return t('communityAuto2.k5', { user: comment?.user ?? t('communityAuto.k1wxp860') });
}

function linkedCourseTo(post) {
  return post?.routeId
    ? { name: 'course-detail', params: { routeId: post.routeId } }
    : '/ai/result';
}

function hasLinkedCourse(post) {
  return Boolean(post?.routeId);
}

function displayPostTags(post) {
  const tags = Array.isArray(post?.tags) ? post.tags : [];
  return hasLinkedCourse(post) ? filterGenericAiCourseTags(tags) : tags;
}

function attachmentImageUrl(attachment) {
  return resolveApiAssetUrl(attachmentUrl(attachment));
}

function attachmentDisplayName(attachment, fallback = t('community.write.photo')) {
  return attachmentName(attachment, fallback);
}

function postFallbackAttachments(post) {
  const attachments = post?.attachments ?? [];
  const failedImages = displayableImageAttachments(attachments).filter((attachment) => {
    const image = attachmentImageUrl(attachment);
    return Boolean(image && failedPostImageKeys.value.has(postImageFailureKey(post, image)));
  });
  return [...fallbackFileAttachments(attachments), ...failedImages];
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
    .map(attachmentImageUrl)
    .filter(Boolean);
  return uniqueValues([...directImages, ...attachmentImages])
    .filter((image) => !failedPostImageKeys.value.has(postImageFailureKey(post, image)))
    .slice(0, MAX_POST_IMAGES);
}

function postImageFailureKey(post, image) {
  return `${postKey(post) || 'post'}::${image}`;
}

function markPostImageFailed(post, image) {
  const next = new Set(failedPostImageKeys.value);
  next.add(postImageFailureKey(post, image));
  failedPostImageKeys.value = next;
}

function openImageViewer(post, index = 0) {
  const images = postImageSources(post);
  if (!images.length) return;
  imageViewerPost.value = post;
  imageViewerIndex.value = Math.max(0, Math.min(index, images.length - 1));
}

function closeImageViewer() {
  imageViewerPost.value = null;
  imageViewerIndex.value = 0;
}

function moveImageViewer(offset) {
  const total = imageViewerImages.value.length;
  if (total <= 1) return;
  imageViewerIndex.value = (imageViewerIndex.value + offset + total) % total;
}

function handleImageViewerKeydown(event) {
  if (!imageViewerImage.value) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    closeImageViewer();
  }
  if (event.key === 'ArrowRight') {
    event.preventDefault();
    moveImageViewer(1);
  }
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    moveImageViewer(-1);
  }
}

function postEditImageFileId(file) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function directPostImageAttachments(post) {
  return uniqueValues([
    post?.imageUrl,
    post?.image_url,
    post?.thumbnailUrl,
    post?.thumbnail_url,
    post?.coverImageUrl,
    post?.cover_image_url,
    post?.attachmentUrl,
    post?.attachment_url,
  ].filter(Boolean)).map((url, index) => ({
    url,
    imageUrl: url,
    thumbnailUrl: url,
    type: 'image',
    name: `image-${index + 1}`,
  }));
}

function editablePostAttachments(post) {
  const attachments = post?.attachments ?? [];
  return buildEditableAttachments(attachments.length ? attachments : directPostImageAttachments(post));
}

function createExistingPostEditImageItem(attachment, index = 0) {
  const previewUrl = attachmentImageUrl(attachment);
  return {
    localKey: `existing-${attachment.editKey ?? attachment.imageId ?? attachment.id ?? previewUrl ?? index}`,
    kind: 'existing',
    attachment,
    previewUrl,
    name: attachmentDisplayName(attachment, `image-${index + 1}`),
    isImage: isDisplayableImageAttachment(attachment) && Boolean(previewUrl),
  };
}

function createNewPostEditImageItem(file) {
  const id = postEditImageFileId(file);
  return {
    localKey: `new-${id}`,
    kind: 'new',
    file,
    previewUrl: URL.createObjectURL(file),
    name: file.name,
    isImage: true,
  };
}

function postEditImageItemName(item, index = 0) {
  if (item.kind === 'new') return item.name || item.file?.name || `image-${index + 1}`;
  return item.name || attachmentDisplayName(item.attachment ?? item, `image-${index + 1}`);
}

function resetPostEditImageItems() {
  postEditImageItems.value.forEach((item) => {
    if (item.kind === 'new' && item.previewUrl) URL.revokeObjectURL(item.previewUrl);
  });
  postEditImageItems.value = [];
}

function handlePostEditImageFiles(event) {
  const input = event.target;
  const files = Array.from(input?.files ?? []).filter((file) => file.type.startsWith('image/'));
  if (!files.length) {
    if (input) input.value = '';
    return;
  }

  const currentImageCount = postEditImageItems.value.filter((item) => item.isImage).length;
  const availableCount = Math.max(0, MAX_POST_IMAGES - currentImageCount);
  if (availableCount <= 0) {
    postNotice.value = {
      tone: 'warning',
      title: t('community.write.imageLimitTitle'),
      text: t('community.write.imageLimitText'),
    };
    if (input) input.value = '';
    return;
  }

  const existingIds = new Set(postEditImageItems.value
    .filter((item) => item.kind === 'new' && item.file)
    .map((item) => postEditImageFileId(item.file)));
  const acceptedFiles = files
    .filter((file) => !existingIds.has(postEditImageFileId(file)))
    .slice(0, availableCount);

  if (files.length > availableCount) {
    postNotice.value = {
      tone: 'warning',
      title: t('community.write.imageLimitTitle'),
      text: t('community.write.imageLimitText'),
    };
  }

  postEditImageItems.value = [
    ...postEditImageItems.value,
    ...acceptedFiles.map(createNewPostEditImageItem),
  ];
  if (input) input.value = '';
}

function removePostEditImageItem(localKey) {
  const target = postEditImageItems.value.find((item) => item.localKey === localKey);
  if (target?.kind === 'new' && target.previewUrl) URL.revokeObjectURL(target.previewUrl);
  postEditImageItems.value = postEditImageItems.value.filter((item) => item.localKey !== localKey);
}

function movePostEditImageItem(index, offset) {
  postEditImageItems.value = moveArrayItem(postEditImageItems.value, index, offset);
}

async function uploadPostEditImages() {
  const uploadPairs = await Promise.all(postEditImageItems.value
    .filter((item) => item.kind === 'new' && item.file)
    .map(async (item) => [item.localKey, await uploadPostImage(item.file)]));
  return new Map(uploadPairs);
}

function postEditAttachmentPayload(uploadedUrlByKey = new Map()) {
  return postEditImageItems.value
    .map((item, index) => {
      const attachment = item.attachment ?? {};
      const url = item.kind === 'new'
        ? uploadedUrlByKey.get(item.localKey)
        : attachmentUrl(attachment);
      if (!url) return null;
      return {
        url,
        imageUrl: url,
        thumbnailUrl: item.kind === 'new' ? url : attachment.thumbnailUrl ?? attachment.thumbnail_url ?? url,
        type: item.kind === 'new' ? 'image' : attachment.type ?? 'image',
        name: postEditImageItemName(item, index),
      };
    })
    .filter(Boolean)
    .slice(0, MAX_POST_IMAGES);
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

function authorDisplayName(post) {
  return post?.nickname || post?.user || post?.authorName || '';
}

function isAuthorFollowLoading(post) {
  const authorId = post?.userId;
  return Boolean(authorId && uiStore.followActionLoadingIds.some((id) => String(id) === String(authorId)));
}

async function toggleAuthorFollow(post) {
  if (!post?.userId) return;
  if (isAuthorFollowed(post)) await uiStore.unfollowUser(post.userId, authorDisplayName(post));
  else await uiStore.followUser(post.userId, authorDisplayName(post));
}

async function createPost() {
  const created = await uiStore.createPost({
    title: title.value,
    body: body.value,
    tags: [activeBoard.value.tag].filter(Boolean),
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
  postEditBoard.value = boards.value.find((board) => (selectedPost.value.tags ?? []).some((tag) => tag.includes(board.tag)))?.id ?? 'drama';
  postEditHashtagInput.value = '';
  postEditHashtags.value = uniqueValues((selectedPost.value.tags ?? [])
    .map(normalizeHashtag)
    .filter((tag) => tag && !isSystemPostTag(tag)))
    .slice(0, MAX_HASHTAGS);
  resetPostEditImageItems();
  postEditImageItems.value = editablePostAttachments(selectedPost.value).map(createExistingPostEditImageItem);
  postNotice.value = null;
}

function resetPostEditState() {
  editingPost.value = false;
  postEditTitle.value = '';
  postEditBody.value = '';
  postEditHashtags.value = [];
  postEditHashtagInput.value = '';
  resetPostEditImageItems();
  postNotice.value = null;
}

function cancelPostEdit() {
  resetPostEditState();
}

async function savePostEdit() {
  const target = selectedPost.value;
  if (!target || postActionLoading.value) return;
  if (postEditTitle.value.trim().length < 2 || postEditBody.value.trim().length < 5) {
    postNotice.value = {
      tone: 'warning',
      title: t('communityAuto2.ko'),
      text: t('communityAuto2.kp'),
    };
    return;
  }
  postActionLoading.value = true;
  postNotice.value = {
    tone: 'info',
    title: t('communityAuto2.kq'),
    text: t('communityAuto2.kr'),
  };
  let updated = null;
  try {
    const uploadedUrlByKey = await uploadPostEditImages();
    const attachments = postEditAttachmentPayload(uploadedUrlByKey);
    updated = await uiStore.editPost(postKey(target), {
      title: postEditTitle.value.trim(),
      body: postEditBody.value.trim(),
      tags: buildPostEditTags(target),
      region: target.region,
      duration: target.duration,
      routeId: target.routeId,
      imageUrl: attachments[0]?.imageUrl ?? null,
      prefix: target.prefix,
      attachments,
    });
  } catch {
    postActionLoading.value = false;
    postNotice.value = {
      tone: 'error',
      title: t('community.write.uploadFailedTitle'),
      text: t('community.write.uploadFailedText'),
    };
    return;
  }
  postActionLoading.value = false;
  if (updated) {
    resetPostEditState();
    return;
  }
  postNotice.value = {
    tone: 'error',
    title: t('communityAuto2.ku'),
    text: uiStore.communityError || t('communityAuto2.kv'),
  };
}

async function deletePost() {
  const target = selectedPost.value;
  if (!target || postActionLoading.value) return;
  postActionLoading.value = true;
  postNotice.value = {
    tone: 'info',
    title: t('communityAuto2.kw'),
    text: t('communityAuto2.kx'),
  };
  const deleted = await uiStore.removePost(postKey(target));
  postActionLoading.value = false;
  showPostDeleteSheet.value = false;
  if (deleted) {
    postNotice.value = {
      tone: 'success',
      title: t('communityAuto2.ky'),
      text: t('communityAuto2.kz'),
    };
    window.setTimeout(() => router.replace('/community'), 450);
    return;
  }
  postNotice.value = {
    tone: 'error',
    title: t('communityAuto2.k10'),
    text: uiStore.communityError || t('communityAuto2.kv'),
  };
}

async function addComment(postId) {
  if (!commentText.value.trim()) {
    commentNotice.value = {
      tone: 'warning',
      title: t('communityAuto.kvzi8xh'),
      text: t('communityAuto2.k11'),
    };
    uiStore.notify(t('communityAuto.kvzi8xh'));
    return;
  }
  commentNotice.value = {
    tone: 'info',
    title: t('communityAuto2.k12'),
    text: t('communityAuto2.k13'),
  };
  const created = await uiStore.addComment(postId, commentText.value);
  if (created) {
    commentText.value = '';
    commentNotice.value = null;
    return;
  }
  commentNotice.value = {
    tone: 'error',
    title: t('communityAuto2.k14'),
    text: uiStore.communityError || t('communityAuto2.k15'),
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
      title: t('communityAuto.kvzi8xh'),
      text: t('communityAuto2.k16'),
    };
    uiStore.notify(t('communityAuto.kvzi8xh'));
    return;
  }
  commentActionLoading.value = true;
  commentNotice.value = {
    tone: 'info',
    title: t('communityAuto2.k17'),
    text: t('communityAuto2.k18'),
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
    title: t('communityAuto2.k19'),
    text: uiStore.communityError || t('communityAuto2.k15'),
  };
}

function startEditComment(comment) {
  editingCommentId.value = commentKey(comment);
  editingCommentText.value = comment.text ?? '';
  commentNotice.value = {
    tone: 'info',
    title: t('communityAuto2.k1a'),
    text: t('communityAuto2.k1b'),
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
      title: t('communityAuto.kvzi8xh'),
      text: t('communityAuto2.k1c'),
    };
    uiStore.notify(t('communityAuto.kvzi8xh'));
    return;
  }
  commentActionLoading.value = true;
  commentNotice.value = {
    tone: 'info',
    title: t('communityAuto2.k1d'),
    text: t('communityAuto2.kr'),
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
    title: t('communityAuto2.k1e'),
    text: uiStore.communityError || t('communityAuto2.kv'),
  };
}

async function deleteComment(postId, comment) {
  const targetId = commentKey(comment);
  if (!targetId || commentActionLoading.value) return;
  commentActionLoading.value = true;
  commentNotice.value = {
    tone: 'info',
    title: t('communityAuto2.k1f'),
    text: t('communityAuto2.k1g'),
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
    title: t('communityAuto2.k1h'),
    text: uiStore.communityError || t('communityAuto2.kv'),
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
    uiStore.notify(t('communityAuto2.k1i'));
    closeShareSheet();
  } catch {
    uiStore.notify(t('communityAuto2.k1j'));
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
      uiStore.notify(t('communityAuto2.k1k'));
    }
  }
}
</script>

<template>
  <AppLayout :title="isPostDetail ? t('community.postDetailTitle') : composeMode ? t('nav.community') : ''" :back="isPostDetail || composeMode">
    <section class="community-screen">
      <template v-if="isBoardList">
        <SearchBar v-model="query" :placeholder="t('communityAuto.kdbrluq')" @focus="router.push('/community/search')" />
        <div class="mode-toggle community-tabs" aria-label="Community sections">
          <RouterLink :class="{ active: activeMode === 'all' }" to="/community">{{ t('communityAuto.kowdtt1') }}</RouterLink>
          <RouterLink :class="{ active: activeMode === 'boards' }" to="/community/boards">{{ t('communityAuto.k7vl8in') }}</RouterLink>
        </div>
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
              <strong>{{ board.fullName }}</strong>
            </span>
            <em>{{ t('communityAuto2.k1s', { count: boardPostCount(board) }) }}</em>
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
                <BaseButton class="post-owner-button" variant="secondary" @click="startPostEdit">{{ t('communityAuto.k4xzvue') }}</BaseButton>
                <BaseButton class="post-owner-button" variant="danger" @click="showPostDeleteSheet = true">{{ t('communityAuto.k149a04s') }}</BaseButton>
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
              <div class="form-field compact post-edit-board-field">
                <span>{{ t('communityAuto.k7vl8in') }}</span>
                <div class="write-board-grid write-board-grid--edit">
                  <button
                    v-for="board in boards"
                    :key="board.id"
                    type="button"
                    :class="{ active: postEditBoard === board.id }"
                    @click="postEditBoard = board.id"
                  >
                    <span>{{ board.name }}</span>
                  </button>
                </div>
              </div>
              <div class="form-field compact">
                <span>{{ t('communityAuto.k1e5ef9d') }}</span>
                <div class="hashtag-input-row">
                  <span aria-hidden="true">#</span>
                  <input
                    v-model="postEditHashtagInput"
                    type="text"
                    maxlength="24"
                    :placeholder="t('communityAuto.kctwhf1')"
                    @keydown="handlePostEditHashtagKeydown"
                    @blur="addPostEditHashtag()"
                  />
                  <button type="button" :aria-label="t('community.write.addHashtag')" :title="t('community.write.addHashtag')" @click="addPostEditHashtag()">+</button>
                </div>
                <div v-if="postEditHashtags.length" class="chip-row wrap write-hashtag-row selected-hashtag-row">
                  <button
                    v-for="tag in postEditHashtags"
                    :key="tag"
                    type="button"
                    class="chip selected"
                    :aria-label="tag + t('communityAuto2.k1l')"
                    @click="removePostEditHashtag(tag)"
                  >
                    #{{ tag }} <span aria-hidden="true">×</span>
                  </button>
                </div>
                <small>{{ postEditHashtags.length }}/{{ MAX_HASHTAGS }}</small>
              </div>
              <label class="form-field compact">{{ t('communityAuto.k1ub2ks6') }}<input v-model="postEditTitle" maxlength="50" :placeholder="t('communityAuto.k5d9iwe')" />
              </label>
              <label class="form-field compact">{{ t('communityAuto.k1supta6') }}<textarea v-model="postEditBody" maxlength="500" :placeholder="t('communityAuto.k99wxgm')"></textarea>
              </label>
              <div v-if="postEditImageItems.length" class="post-edit-attachment-manager">
                <div class="post-edit-attachment-heading">
                  <strong>{{ t('community.edit.attachmentsTitle') }}</strong>
                  <small>{{ t('community.edit.attachmentsHelp') }}</small>
                </div>
                <div class="post-edit-image-grid">
                  <figure
                    v-for="(item, index) in postEditImageItems"
                    :key="item.localKey"
                    class="post-edit-image-item"
                    :class="{ 'post-edit-image-item--new': item.kind === 'new' }"
                  >
                    <div class="post-edit-image-frame">
                      <img
                        v-if="item.isImage && item.previewUrl"
                        :src="item.previewUrl"
                        :alt="item.kind === 'new' ? t('community.edit.newImageAlt', { index: index + 1 }) : t('community.edit.existingImageAlt', { index: index + 1 })"
                        :title="postEditImageItemName(item, index)"
                      />
                      <span v-else>{{ postEditImageItemName(item, index) }}</span>
                      <span v-if="item.kind === 'new'" class="post-edit-image-badge">{{ t('community.edit.newImageBadge') }}</span>
                    </div>
                    <figcaption>{{ postEditImageItemName(item, index) }}</figcaption>
                    <div class="post-edit-image-actions">
                      <button type="button" :disabled="index === 0" :aria-label="t('community.edit.movePrevious')" :title="t('community.edit.movePrevious')" @click="movePostEditImageItem(index, -1)">&lt;</button>
                      <button type="button" :disabled="index === postEditImageItems.length - 1" :aria-label="t('community.edit.moveNext')" :title="t('community.edit.moveNext')" @click="movePostEditImageItem(index, 1)">&gt;</button>
                      <button type="button" class="danger" :aria-label="t('community.edit.removeImage')" :title="t('community.edit.removeImage')" @click="removePostEditImageItem(item.localKey)">x</button>
                    </div>
                  </figure>
                </div>
              </div>
              <label class="form-field compact attachment-field post-edit-attachment-field">
                <span>{{ t('community.edit.imageFile') }}</span>
                <input type="file" accept="image/*" multiple @change="handlePostEditImageFiles" />
                <small>{{ t('community.edit.imageFileHelp') }}</small>
              </label>
              <div class="post-owner-actions post-edit-actions">
                <BaseButton :disabled="postActionLoading || postEditTitle.trim().length < 2 || postEditBody.trim().length < 5" @click="savePostEdit">
                  {{ postActionLoading ? t('communityAuto2.k1m') : t('common.save') }}
                </BaseButton>
                <BaseButton variant="secondary" :disabled="postActionLoading" @click="cancelPostEdit">{{ t('communityAuto.kjiry9t') }}</BaseButton>
              </div>
            </template>
            <template v-else>
              <h1>{{ selectedPost.title }}</h1>
              <TranslatableText :text="selectedPost.body" :source-language="selectedPost.language" resource-type="POST" :resource-id="postKey(selectedPost)" field="content" />
            </template>
            <div v-if="!editingPost && postImageSources(selectedPost).length" class="post-gallery post-gallery--detail" :aria-label="t('communityAuto.kfroizt')">
              <button
                v-for="(image, index) in postImageSources(selectedPost)"
                :key="`post-image-${index}-${image}`"
                type="button"
                class="post-gallery-item"
                :aria-label="t('community.a11y.postImageOpen', { index: index + 1 })"
                @click="openImageViewer(selectedPost, index)"
              >
                <img :src="image" alt="" @error="markPostImageFailed(selectedPost, image)" />
              </button>
            </div>
            <div v-if="!editingPost && postFallbackAttachments(selectedPost).length" class="attachment-preview-list">
              <span v-for="attachment in postFallbackAttachments(selectedPost)" :key="attachment.id ?? attachment.imageId ?? attachment.url ?? attachment.name">
                {{ t('community.edit.fallbackFile') }} · {{ attachmentDisplayName(attachment, t('community.edit.fallbackFile')) }}
              </span>
            </div>
            <div v-if="displayPostTags(selectedPost).length" class="tag-row"><span v-for="tag in displayPostTags(selectedPost)" :key="tag">{{ tag }}</span></div>
            <RouterLink v-if="hasLinkedCourse(selectedPost)" class="linked-course" :to="linkedCourseTo(selectedPost)">
              <span class="course-dot">AI</span>
              <div>
                <small class="course-kicker">{{ t('communityAuto.k166mo55') }}</small>
                <strong>{{ t('community.linkedCourse.title', { region: selectedPost.region }) }}</strong>
                <small>{{ t('community.linkedCourse.meta', { region: selectedPost.region, duration: selectedPost.duration }) }}</small>
              </div>
              <span class="linked-course-cta">{{ t('communityAuto.k1nbnyzt') }}</span>
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
              <a href="#community-comments" @click.prevent="focusCommentSection">{{ t('communityAuto2.k1v', { count: selectedCommentCount }) }}</a>
              <button
                type="button"
                :class="{ 'is-active': isPostScrapped(selectedPost) }"
                @click="uiStore.togglePostScrap(postKey(selectedPost))"
              >
                {{ isPostScrapped(selectedPost) ? t('communityAuto.ksf2n5k') : t('communityAuto.k1y81wz0') }}
              </button>
              <button type="button" @click="openShareSheet(selectedPost)">{{ t('communityAuto.k1vcmj4') }}</button>
            </div>
            <div v-if="showPostDeleteSheet" class="sheet-backdrop" @click="showPostDeleteSheet = false">
              <div class="bottom-sheet delete-course-sheet" role="dialog" aria-modal="true" :aria-label="t('communityAuto.kfzlptw')" @click.stop>
                <div class="sheet-handle"></div>
                <h2>{{ t('communityAuto.koccas3') }}</h2>
                <p>{{ t('communityAuto.knp5gnz') }}</p>
                <div class="sheet-actions two">
                  <BaseButton variant="secondary" :disabled="postActionLoading" @click="showPostDeleteSheet = false">{{ t('communityAuto.kjiry9t') }}</BaseButton>
                  <BaseButton variant="danger" :disabled="postActionLoading" @click="deletePost">
                    {{ postActionLoading ? t('communityAuto.kbhchor') : t('communityAuto.k149a04s') }}
                  </BaseButton>
                </div>
              </div>
            </div>
          </article>

          <CommentThread v-if="!editingPost" :count="selectedCommentCount">
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
              :title="t('communityAuto.kmfj9kw')"
              :text="t('communityAuto.kmzt68v')"
            />
            <EmptyState
              v-else-if="commentSectionNeedsRetry"
              icon="!"
              tone="error"
              compact
              :title="t('communityAuto.k1juvedb')"
              :text="uiStore.communityError || t('communityAuto.k1t99km4')"
              :action-label="t('communityAuto.k4f8zfi')"
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
                        :placeholder="t('communityAuto.kvzi8xh')"
                      ></textarea>
                      <div class="comment-row-actions">
                        <button
                          type="button"
                          class="comment-action-button is-primary"
                          :disabled="commentActionLoading || !editingCommentText.trim()"
                          @click="saveEditedComment(postKey(selectedPost))"
                        >{{ t('communityAuto.k1xp6hfy') }}</button>
                        <button type="button" class="comment-action-button" :disabled="commentActionLoading" @click="cancelEditComment">{{ t('communityAuto.kjiry9t') }}</button>
                      </div>
                    </template>
                    <template v-else>
                      <TranslatableText :text="comment.text" :source-language="comment.language" resource-type="COMMENT" :resource-id="commentKey(comment)" field="content" />
                      <div class="comment-row-actions">
                        <button
                          type="button"
                          class="comment-action-button"
                          :aria-label="t('community.a11y.replyToUser', { user: comment.user })"
                          @click="startReply(comment)"
                        >{{ t('communityAuto.k1qte1m8') }}</button>
                        <button
                          v-if="isCommentOwner(comment)"
                          type="button"
                          class="comment-action-button"
                          :disabled="commentActionLoading"
                          :aria-label="t('community.a11y.editCommentUser', { user: comment.user })"
                          @click="startEditComment(comment)"
                        >{{ t('communityAuto.k4xzvue') }}</button>
                        <button
                          v-if="isCommentOwner(comment)"
                          type="button"
                          class="comment-action-button is-danger"
                          :disabled="commentActionLoading"
                          :aria-label="t('community.a11y.deleteCommentUser', { user: comment.user })"
                          @click="deleteComment(postKey(selectedPost), comment)"
                        >{{ t('communityAuto.k149a04s') }}</button>
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
                        >{{ t('communityAuto.k44cu1f') }}</button>
                        <button type="button" :disabled="commentActionLoading" @click="cancelReply">{{ t('communityAuto.kjiry9t') }}</button>
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
                          :placeholder="t('communityAuto.kvzi8xh')"
                        ></textarea>
                        <div class="comment-row-actions">
                          <button
                            type="button"
                            class="comment-action-button is-primary"
                            :disabled="commentActionLoading || !editingCommentText.trim()"
                            @click="saveEditedComment(postKey(selectedPost))"
                          >{{ t('communityAuto.k1xp6hfy') }}</button>
                          <button type="button" class="comment-action-button" :disabled="commentActionLoading" @click="cancelEditComment">{{ t('communityAuto.kjiry9t') }}</button>
                        </div>
                      </template>
                      <template v-else>
                        <TranslatableText :text="reply.text" :source-language="reply.language" resource-type="COMMENT" :resource-id="commentKey(reply)" field="content" />
                        <div class="comment-row-actions">
                          <button
                            type="button"
                            class="comment-action-button"
                            :aria-label="t('community.a11y.replyToUser', { user: reply.user })"
                            @click="startReply(reply)"
                          >{{ t('communityAuto.k1qte1m8') }}</button>
                          <button
                            v-if="isCommentOwner(reply)"
                            type="button"
                            class="comment-action-button"
                            :disabled="commentActionLoading"
                            :aria-label="t('community.a11y.editReplyUser', { user: reply.user })"
                            @click="startEditComment(reply)"
                          >{{ t('communityAuto.k4xzvue') }}</button>
                          <button
                            v-if="isCommentOwner(reply)"
                            type="button"
                            class="comment-action-button is-danger"
                            :disabled="commentActionLoading"
                            :aria-label="t('community.a11y.deleteReplyUser', { user: reply.user })"
                            @click="deleteComment(postKey(selectedPost), reply)"
                          >{{ t('communityAuto.k149a04s') }}</button>
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
                          >{{ t('communityAuto.k44cu1f') }}</button>
                          <button type="button" :disabled="commentActionLoading" @click="cancelReply">{{ t('communityAuto.kjiry9t') }}</button>
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
              :title="t('communityAuto.kka907d')"
              :text="t('communityAuto.kpedprg')"
            />
            <div v-if="uiStore.currentUser" class="comment-box">
              <input v-model="commentText" :placeholder="t('communityAuto.khjll7g')" @keyup.enter="addComment(postKey(selectedPost))" />
              <button type="button" :disabled="!commentText.trim()" @click="addComment(postKey(selectedPost))">{{ t('communityAuto.k44cu1f') }}</button>
            </div>
            <EmptyState
              v-else
              icon="L"
              tone="login"
              compact
              :title="t('communityAuto.kt1lbwa')"
              :text="t('communityAuto.k4x2ynu')"
              :action-label="t('communityAuto.k1naycwj')"
              action-to="/login"
            />
          </CommentThread>
        </CommunityPostDetailPanel>
        <EmptyState
          v-else-if="uiStore.communityLoading"
          tone="loading"
          compact
          :title="t('communityAuto.km6jghz')"
          :text="t('communityAuto.k1mtn7u6')"
        />
        <DetailNotFoundPanel
          v-else
          :title="t('communityAuto.k1anh7ve')"
          :text="t('communityAuto.k1l56hjk')"
          :list-label="t('communityAuto.kpxy5yp')"
          list-to="/community"
          @retry="loadCommunity"
        />
      </template>

      <template v-else>
        <SearchBar v-model="query" :placeholder="t('communityAuto.kdbrluq')" />
        <div class="mode-toggle community-tabs" aria-label="Community sections">
          <RouterLink :class="{ active: activeMode === 'all' }" to="/community">{{ t('communityAuto.kowdtt1') }}</RouterLink>
          <RouterLink :class="{ active: activeMode === 'boards' }" to="/community/boards">{{ t('communityAuto.k7vl8in') }}</RouterLink>
        </div>
        <div v-if="!isBoardFeed" class="list-control-row community-sort-row" :aria-label="t('communityAuto.k16gamjy')">
          <span class="list-control-label">{{ t('communityAuto.k1u22q50') }}</span>
          <SortSegmentedControl
            v-model="sort"
            :options="sortOptions"
            :aria-label="t('communityAuto.khg1xgu')"
          />
          <span class="list-result-count" aria-live="polite">{{ t('communityAuto2.k1t', { count: sortedPosts.length }) }}</span>
        </div>

        <form v-if="composeMode" class="compose-card" @submit.prevent="createPost">
          <label class="form-field">{{ t('communityAuto.k1ub2ks6') }}<input v-model="title" :placeholder="t('communityAuto.k1mpzjd5')" /></label>
          <label class="form-field">{{ t('communityAuto.k1supta6') }}<textarea v-model="body" :placeholder="t('communityAuto.k5p4uqt')"></textarea></label>
          <BaseButton block>{{ t('communityAuto.k1856ft1') }}</BaseButton>
        </form>

        <div v-if="isBoardFeed" class="board-selector">
          <div class="board-banner board-banner--selector">
            <span :class="['board-icon', `board-${activeBoard.id}`]" aria-hidden="true">
              <span class="board-icon-symbol">{{ activeBoard.icon }}</span>
            </span>
            <div class="board-selector-copy">
              <strong>{{ activeBoard.name }}</strong>
            </div>
            <button
              type="button"
              class="board-accordion-toggle"
              :aria-expanded="boardSelectorOpen"
              :aria-label="t('communityAuto.k18idub2')"
              @click="toggleBoardSelector"
            >
              <span class="board-selector-chevron" :class="{ open: boardSelectorOpen }" aria-hidden="true">&#8964;</span>
            </button>
          </div>
          <div v-if="boardSelectorOpen" class="board-accordion-list">
            <button
              v-for="board in otherBoards"
              :key="board.id"
              type="button"
              class="board-accordion-option"
              @click="selectBoard(board)"
            >
              <span :class="['board-icon', `board-${board.id}`]" aria-hidden="true">
                <span class="board-icon-symbol">{{ board.icon }}</span>
              </span>
              <span class="board-option-copy">
                <strong>{{ board.name }}</strong>
                <small>{{ t('communityAuto2.k1s', { count: boardPostCount(board) }) }}</small>
              </span>
            </button>
          </div>
        </div>

        <div v-if="isBoardFeed" class="list-control-row community-sort-row" :aria-label="t('communityAuto.k16gamjy')">
          <span class="list-control-label">{{ t('communityAuto.k1u22q50') }}</span>
          <SortSegmentedControl
            v-model="sort"
            :options="sortOptions"
            :aria-label="t('communityAuto.khg1xgu')"
          />
          <span class="list-result-count" aria-live="polite">{{ t('communityAuto2.k1t', { count: sortedPosts.length }) }}</span>
        </div>

        <div v-if="!isBoardFeed" class="feed-summary">
          <strong>{{ t('communityAuto2.k1u', { count: sortedPosts.length }) }}</strong>
        </div>

        <EmptyState
          v-if="uiStore.communityLoading"
          tone="loading"
          compact
          :title="t('communityAuto.kayho8x')"
          :text="t('communityAuto.k18s7zcj')"
        />
        <EmptyState
          v-else-if="uiStore.communityError"
          icon="!"
          tone="error"
          compact
          :title="t('communityAuto.k6lajqj')"
          :text="uiStore.communityError"
          :action-label="t('communityAuto.ko6d5xb')"
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
                {{ isAuthorFollowLoading(post) ? t('communityAuto2.k1o') : isAuthorFollowed(post) ? t('communityAuto2.k1p') : t('communityAuto2.k1q') }}
              </button>
            </div>
            <RouterLink
              class="feed-card-main"
              :class="{ 'feed-card-main--text-only': !postImageSources(post).length }"
              :to="`/community/post/${postKey(post)}`"
            >
              <div v-if="postImageSources(post).length" class="feed-thumb feed-thumb--image">
                <img :src="postImageSources(post)[0]" alt="" @error="markPostImageFailed(post, postImageSources(post)[0])" />
                <span v-if="postImageSources(post).length > 1" class="feed-thumb-count">+{{ postImageSources(post).length - 1 }}</span>
              </div>
              <div class="feed-body">
                <h2>{{ post.title }}</h2>
                <p>{{ post.body }}</p>
                <div v-if="displayPostTags(post).length" class="tag-row"><span v-for="tag in displayPostTags(post)" :key="tag">{{ tag }}</span></div>
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
              <RouterLink :to="`/community/post/${postKey(post)}`">{{ t('communityAuto2.k1v', { count: postCommentCount(post) }) }}</RouterLink>
              <button
                type="button"
                :class="{ 'is-active': isPostScrapped(post) }"
                @click="uiStore.togglePostScrap(postKey(post))"
              >
                {{ isPostScrapped(post) ? t('communityAuto.ksf2n5k') : t('communityAuto.k1y81wz0') }}
              </button>
            </div>
          </article>
        </div>
        <div v-if="hasMorePosts" class="load-more-row">
          <button type="button" @click="loadMorePosts">{{ t('communityAuto.knkzs11') }}</button>
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

    <div v-if="imageViewerImage" class="community-image-viewer-backdrop" role="dialog" aria-modal="true" :aria-label="t('communityAuto.k1u24yco')" @click.self="closeImageViewer">
      <section class="community-image-viewer">
        <header>
          <span>{{ imageViewerIndex + 1 }} / {{ imageViewerImages.length }}</span>
          <button type="button" :aria-label="t('communityAuto.k1oxvxfm')" @click="closeImageViewer">×</button>
        </header>
        <div class="community-image-viewer-body">
          <button v-if="imageViewerImages.length > 1" type="button" class="image-viewer-nav prev" :aria-label="t('communityAuto.k279do1')" @click="moveImageViewer(-1)">‹</button>
          <img :src="imageViewerImage" :alt="t('communityAuto.k1u24yco')" @error="markPostImageFailed(imageViewerPost, imageViewerImage); closeImageViewer()" />
          <button v-if="imageViewerImages.length > 1" type="button" class="image-viewer-nav next" :aria-label="t('communityAuto.ka7lzvt')" @click="moveImageViewer(1)">›</button>
        </div>
      </section>
    </div>

    <div v-if="shareTarget" class="sheet-backdrop" @click.self="closeShareSheet">
      <div class="bottom-sheet community-share-sheet" role="dialog" aria-modal="true" :aria-label="t('communityAuto.ky1eeco')">
        <div class="sheet-handle"></div>
        <h2>{{ t('communityAuto.kv79prs') }}</h2>
        <p>{{ shareTarget.title }}</p>
        <div class="share-preview">
          <span>{{ shareTarget.region }}</span>
          <strong>{{ t('community.share.courseReview', { duration: shareTarget.duration }) }}</strong>
        </div>
        <div class="share-options">
          <button type="button" @click="nativeShare">
            <span aria-hidden="true">↗</span>{{ t('communityAuto.ko666xe') }}</button>
          <button type="button" @click="copyShareLink">
            <span aria-hidden="true">⛓</span>{{ t('communityAuto.k135sohl') }}</button>
        </div>
        <BaseButton variant="secondary" block @click="closeShareSheet">{{ t('communityAuto.k11apzn2') }}</BaseButton>
      </div>
    </div>
  </AppLayout>
</template>
