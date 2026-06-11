import { unwrapApiData } from './error.js';
import { http } from './http.js';

function toApiVisitStatus(status) {
  if (status === 'planned' || status === 'WANT_TO_GO') return 'WANT_TO_GO';
  if (status === 'completed' || status === 'VISITED') return 'VISITED';
  return status;
}

function fromApiVisitStatus(status) {
  if (status === 'WANT_TO_GO') return 'planned';
  if (status === 'VISITED') return 'completed';
  return status;
}

function listFrom(payload) {
  const data = unwrapApiData(payload);
  return Array.isArray(data) ? data : data?.items ?? [];
}

export async function fetchMyLikes() {
  try {
    const [{ data: contentIds }, { data: placeIds }] = await Promise.all([
      http.get('/users/me/liked-contents'),
      http.get('/users/me/liked-places'),
    ]);
    return {
      contentIds: listFrom(contentIds),
      placeIds: listFrom(placeIds),
    };
  } catch {
    const { data } = await http.get('/users/me/likes');
    const likes = unwrapApiData(data) ?? {};
    return {
      contentIds: likes.contentIds ?? likes.likedContentIds ?? [],
      placeIds: likes.placeIds ?? likes.likedPlaceIds ?? [],
    };
  }
}

export async function likeContent(contentId) {
  await http.post(`/contents/${contentId}/likes`);
}

export async function unlikeContent(contentId) {
  await http.delete(`/contents/${contentId}/likes`);
}

export async function likePlace(placeId) {
  await http.post(`/places/${placeId}/likes`);
}

export async function unlikePlace(placeId) {
  await http.delete(`/places/${placeId}/likes`);
}

export async function fetchMyVisitStatus() {
  const { data } = await http.get('/users/me/visit-status');
  const list = listFrom(data);
  return list.map((item) => ({
    ...item,
    status: fromApiVisitStatus(item.status),
  }));
}

export async function setPlaceVisitStatus(placeId, status) {
  const { data } = await http.put(`/places/${placeId}/visit-status`, { status: toApiVisitStatus(status) });
  const visitStatus = unwrapApiData(data) ?? {};
  return {
    ...visitStatus,
    status: fromApiVisitStatus(visitStatus.status),
  };
}

export async function clearPlaceVisitStatus(placeId) {
  await http.delete(`/places/${placeId}/visit-status`);
  return true;
}
