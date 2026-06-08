import { http } from './http.js';

export async function fetchIntegratedSearch(params = {}) {
  const { data } = await http.get('/search', { params });
  return data;
}
