import { http } from './http.js';

export async function fetchPlaces(params = {}) {
  const { data } = await http.get('/places', { params });
  return data;
}

export async function fetchPlaceDetail(placeId) {
  const { data } = await http.get(`/places/${placeId}`);
  return data;
}
