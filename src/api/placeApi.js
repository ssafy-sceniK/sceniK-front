import { http } from './http.js';
import { unwrapApiData } from './error.js';

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizePlace(place) {
  if (!place) return null;
  return {
    ...place,
    tags: asArray(place.tags),
    relatedContentIds: asArray(place.relatedContentIds),
    relatedContents: asArray(place.relatedContents),
  };
}

export async function fetchPlaces(params = {}) {
  const { data } = await http.get('/places', { params });
  return asArray(unwrapApiData(data)).map(normalizePlace).filter(Boolean);
}

export async function fetchPlaceDetail(placeId) {
  const { data } = await http.get(`/places/${placeId}`);
  return normalizePlace(unwrapApiData(data));
}
