import { unwrapApiData } from './error.js';
import { http } from './http.js';

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function listFrom(data, key = 'items') {
  const payload = unwrapApiData(data);
  if (Array.isArray(payload)) return payload;
  return payload?.[key] ?? payload?.items ?? payload?.data ?? [];
}

export function normalizeReview(review = {}) {
  return {
    ...review,
    reviewId: firstDefined(review.reviewId, review.id),
    placeId: firstDefined(review.placeId, review.place_id),
    userId: firstDefined(review.userId, review.user_id),
    nickname: firstDefined(review.nickname, review.user, review.authorNickname, 'sceniK user'),
    rating: Number(firstDefined(review.rating, 0)),
    content: firstDefined(review.content, review.body, review.text, ''),
    language: firstDefined(review.language, review.sourceLanguage, 'unknown'),
  };
}

export async function fetchPlaceReviews(placeId) {
  const { data } = await http.get(`/places/${placeId}/reviews`);
  return listFrom(data).map(normalizeReview);
}

export async function createPlaceReview(placeId, payload) {
  const { data } = await http.post(`/places/${placeId}/reviews`, payload);
  const response = unwrapApiData(data) ?? data;
  return normalizeReview(response?.review ?? response);
}

export async function updatePlaceReview(placeId, reviewId, payload) {
  const { data } = await http.patch(`/places/${placeId}/reviews/${reviewId}`, payload);
  const response = unwrapApiData(data) ?? data;
  return normalizeReview(response?.review ?? response);
}

export async function deletePlaceReview(placeId, reviewId) {
  await http.delete(`/places/${placeId}/reviews/${reviewId}`);
  return true;
}

export async function fetchMyReviews() {
  const { data } = await http.get('/users/me/reviews');
  return listFrom(data).map(normalizeReview);
}