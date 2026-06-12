import { http } from './http.js';
import { unwrapApiData } from './error.js';

export async function fetchPlaces(params = {}) {
  const { data } = await http.get('/places', { params });
  return unwrapApiData(data);
}

export async function fetchPlaceDetail(placeId) {
  const { data } = await http.get(`/places/${placeId}`);
  return unwrapApiData(data);
}
