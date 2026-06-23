import { http } from './http.js';
import { unwrapApiData } from './error.js';

export async function translateResource(payload) {
  const { data } = await http.post('/translations', payload);
  return unwrapApiData(data) ?? data;
}
