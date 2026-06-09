import { http } from './http.js';

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function normalizeComment(comment = {}) {
  const commentId = firstDefined(comment.commentId, comment.id);
  const likeCount = Number(firstDefined(comment.likeCount, comment.likes, 0));
  const likedByMe = Boolean(firstDefined(comment.likedByMe, comment.isLiked, comment.liked, false));
  return {
    ...comment,
    id: comment.id ?? commentId,
    commentId,
    postId: firstDefined(comment.postId, comment.communityPostId),
    user: firstDefined(comment.user, comment.nickname, comment.authorNickname, comment.authorName, 'sceniK user'),
    userId: firstDefined(comment.userId, comment.authorId),
    text: firstDefined(comment.text, comment.body, comment.content, ''),
    date: firstDefined(comment.date, comment.createdAt?.slice?.(0, 10), ''),
    likeCount,
    likes: likeCount,
    likedByMe,
    isLiked: likedByMe,
  };
}

export function normalizePost(post = {}) {
  const postId = firstDefined(post.postId, post.id);
  const comments = (post.comments ?? post.commentItems ?? []).map(normalizeComment);
  return {
    ...post,
    id: post.id ?? postId,
    postId,
    user: firstDefined(post.user, post.nickname, post.authorNickname, post.authorName, 'sceniK user'),
    userId: firstDefined(post.userId, post.authorId),
    date: firstDefined(post.date, post.createdAt?.slice?.(0, 10), ''),
    title: firstDefined(post.title, 'Untitled post'),
    body: firstDefined(post.body, post.content, post.text, ''),
    content: firstDefined(post.content, post.body, post.text, ''),
    region: firstDefined(post.region, 'Korea'),
    duration: firstDefined(post.duration, post.durationLabel, post.durationDays && `${post.durationDays} days`),
    routeId: firstDefined(post.routeId, post.travelRouteId),
    tags: Array.isArray(post.tags) ? post.tags : [],
    likes: Number(firstDefined(post.likes, post.likeCount, 0)),
    isLiked: Boolean(firstDefined(post.isLiked, post.liked, false)),
    likedBy: post.likedBy ?? [],
    scrappedBy: post.scrappedBy ?? [],
    comments,
  };
}

function listFrom(data, key) {
  if (Array.isArray(data)) return data;
  return data?.[key] ?? data?.items ?? data?.data ?? [];
}

export async function getPosts(params = {}) {
  const { data } = await http.get('/posts', { params });
  return listFrom(data, 'posts').map(normalizePost);
}

export async function getPost(postId) {
  const { data } = await http.get(`/posts/${postId}`);
  return normalizePost(data.post ?? data);
}

export async function createPost(payload) {
  const { data } = await http.post('/posts', {
    ...payload,
    content: payload.content ?? payload.body,
  });
  return normalizePost(data.post ?? data);
}

export async function updatePost(postId, payload) {
  const { data } = await http.patch(`/posts/${postId}`, {
    ...payload,
    content: payload.content ?? payload.body,
  });
  return normalizePost(data.post ?? data);
}

export async function deletePost(postId) {
  await http.delete(`/posts/${postId}`);
  return true;
}

export async function getComments(postId) {
  const { data } = await http.get(`/posts/${postId}/comments`);
  return listFrom(data, 'comments').map(normalizeComment);
}

export async function createComment(postId, payload) {
  const { data } = await http.post(`/posts/${postId}/comments`, {
    ...payload,
    content: payload.content ?? payload.text,
  });
  return normalizeComment(data.comment ?? data);
}

export async function updateComment(postId, commentId, payload) {
  const { data } = await http.patch(`/posts/${postId}/comments/${commentId}`, {
    ...payload,
    content: payload.content ?? payload.text,
  });
  return normalizeComment(data.comment ?? data);
}

export async function deleteComment(postId, commentId) {
  await http.delete(`/posts/${postId}/comments/${commentId}`);
  return true;
}

export async function likeComment(commentId) {
  const { data } = await http.post(`/posts/comments/${commentId}/likes`);
  return data ? normalizeComment(data.comment ?? data) : null;
}

export async function unlikeComment(commentId) {
  const { data } = await http.delete(`/posts/comments/${commentId}/likes`);
  return data ? normalizeComment(data.comment ?? data) : null;
}

export async function likePost(postId) {
  const { data } = await http.post(`/posts/${postId}/likes`);
  return data ? normalizePost(data.post ?? data) : null;
}

export async function unlikePost(postId) {
  const { data } = await http.delete(`/posts/${postId}/likes`);
  return data ? normalizePost(data.post ?? data) : null;
}

export async function reportPost(postId, payload = {}) {
  const { data } = await http.post(`/posts/${postId}/reports`, payload);
  return data;
}

export async function getNotifications() {
  const { data } = await http.get('/notifications');
  const list = Array.isArray(data) ? data : data.items ?? data.notifications ?? [];
  return list.map((item) => ({
    ...item,
    id: item.notificationId ?? item.id,
    read: Boolean(item.isRead ?? item.read),
    subtitle: item.message ?? item.subtitle ?? '',
    time: item.createdAt?.slice?.(0, 10) ?? '',
  }));
}
