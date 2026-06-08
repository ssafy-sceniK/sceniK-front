import { http } from './http.js';

export async function fetchContents(params = {}) {
  const { data } = await http.get('/contents', { params });
  return data;
}

export async function fetchContentDetail(contentId) {
  const { data } = await http.get(`/contents/${contentId}`);
  return data;
}

export async function fetchContentPlaces(contentId) {
  const { data } = await http.get(`/contents/${contentId}/places`);
  return data;
}
