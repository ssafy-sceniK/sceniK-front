import { http } from './http.js';

export async function fetchAdminContents() {
  const { data } = await http.get('/contents', {
    params: { page: 0, size: 100, sort: 'latest' },
  });
  return data;
}

export async function createAdminContent(payload) {
  const { data } = await http.post('/admin/contents', payload);
  return data;
}

export async function updateAdminContent(contentId, payload) {
  const { data } = await http.patch(`/admin/contents/${contentId}`, payload);
  return data;
}

export async function deleteAdminContent(contentId) {
  await http.delete(`/admin/contents/${contentId}`);
}

export async function fetchAdminPlaces() {
  const { data } = await http.get('/places', {
    params: { page: 0, size: 100, sort: 'name' },
  });
  return data;
}

export async function createAdminPlace(payload) {
  const { data } = await http.post('/admin/places', payload);
  return data;
}

export async function updateAdminPlace(placeId, payload) {
  const { data } = await http.patch(`/admin/places/${placeId}`, payload);
  return data;
}

export async function deleteAdminPlace(placeId) {
  await http.delete(`/admin/places/${placeId}`);
}
