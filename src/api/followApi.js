import { unwrapApiData } from './error.js';
import { http } from './http.js';

function normalizeFollowUser(user = {}) {
  const userId = user.userId ?? user.id;
  return {
    ...user,
    id: user.id ?? userId,
    userId,
    nickname: user.nickname ?? user.name ?? 'sceniK user',
    followerCount: Number(user.followerCount ?? 0),
    followingCount: Number(user.followingCount ?? 0),
    followedByMe: Boolean(user.followedByMe),
  };
}

function normalizeFollowStatus(status = {}) {
  return {
    ...status,
    userId: status.userId ?? status.id,
    followedByMe: Boolean(status.followedByMe),
    followerCount: Number(status.followerCount ?? 0),
    followingCount: Number(status.followingCount ?? 0),
  };
}

function listFrom(data) {
  const payload = unwrapApiData(data);
  return Array.isArray(payload) ? payload : payload?.items ?? payload?.users ?? [];
}

export async function followUser(userId) {
  const { data } = await http.post(`/users/${userId}/follow`);
  return normalizeFollowStatus(unwrapApiData(data));
}

export async function unfollowUser(userId) {
  const { data } = await http.delete(`/users/${userId}/follow`);
  return normalizeFollowStatus(unwrapApiData(data));
}

export async function fetchFollowers(userId) {
  const { data } = await http.get(`/users/${userId}/followers`);
  return listFrom(data).map(normalizeFollowUser);
}

export async function fetchFollowing(userId) {
  const { data } = await http.get(`/users/${userId}/following`);
  return listFrom(data).map(normalizeFollowUser);
}

export async function fetchMyFollowing() {
  const { data } = await http.get('/users/me/following');
  return listFrom(data).map(normalizeFollowUser);
}
