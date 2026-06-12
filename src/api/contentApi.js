import { unwrapApiData } from './error.js';
import { http } from './http.js';

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeContent(content) {
  if (!content) return null;
  return {
    ...content,
    tags: asArray(content.tags),
    relatedPlaces: asArray(content.relatedPlaces),
    relatedContents: asArray(content.relatedContents),
  };
}

function normalizeRelatedPlace(place) {
  if (!place) return null;
  return {
    ...place,
    tags: asArray(place.tags),
    relatedContentIds: asArray(place.relatedContentIds),
    relatedContents: asArray(place.relatedContents),
  };
}

export async function fetchContents(params = {}) {
  const { data } = await http.get('/contents', { params });
  return asArray(unwrapApiData(data)).map(normalizeContent).filter(Boolean);
}

export async function fetchContentDetail(contentId) {
  const { data } = await http.get(`/contents/${contentId}`);
  return normalizeContent(unwrapApiData(data));
}

export async function fetchContentPlaces(contentId) {
  const { data } = await http.get(`/contents/${contentId}/places`);
  return asArray(unwrapApiData(data)).map(normalizeRelatedPlace).filter(Boolean);
}
