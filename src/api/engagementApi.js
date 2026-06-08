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

export async function fetchMyLikes() {
  try {
    const [{ data: contentIds }, { data: placeIds }] = await Promise.all([
      http.get('/users/me/liked-contents'),
      http.get('/users/me/liked-places'),
    ]);
    return {
      contentIds: Array.isArray(contentIds) ? contentIds : contentIds.items ?? [],
      placeIds: Array.isArray(placeIds) ? placeIds : placeIds.items ?? [],
    };
  } catch {
    const { data } = await http.get('/users/me/likes');
    return {
      contentIds: data.contentIds ?? data.likedContentIds ?? [],
      placeIds: data.placeIds ?? data.likedPlaceIds ?? [],
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
  const list = Array.isArray(data) ? data : data.items ?? [];
  return list.map((item) => ({
    ...item,
    status: fromApiVisitStatus(item.status),
  }));
}

export async function setPlaceVisitStatus(placeId, status) {
  const { data } = await http.put(`/places/${placeId}/visit-status`, { status: toApiVisitStatus(status) });
  return {
    ...data,
    status: fromApiVisitStatus(data.status),
  };
}

export async function clearPlaceVisitStatus(placeId) {
  await http.delete(`/places/${placeId}/visit-status`);
  return true;
}
