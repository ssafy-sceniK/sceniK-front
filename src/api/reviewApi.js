import { http } from './http.js';

export async function fetchPlaceReviews(placeId) {
  const { data } = await http.get(`/places/${placeId}/reviews`);
  return Array.isArray(data) ? data : data.items ?? [];
}

export async function createPlaceReview(placeId, payload) {
  const { data } = await http.post(`/places/${placeId}/reviews`, payload);
  return data;
}

export async function updatePlaceReview(placeId, reviewId, payload) {
  const { data } = await http.patch(`/places/${placeId}/reviews/${reviewId}`, payload);
  return data;
}

export async function deletePlaceReview(placeId, reviewId) {
  await http.delete(`/places/${placeId}/reviews/${reviewId}`);
  return true;
}

export async function fetchMyReviews() {
  const { data } = await http.get('/users/me/reviews');
  return Array.isArray(data) ? data : data.items ?? [];
}
