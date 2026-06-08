import { http } from './http.js';
import { normalizeRoutePayload } from './routeApi.js';

export async function generateAiRoute(payload) {
  const { data } = await http.post('/ai/routes', payload);
  return normalizeRoutePayload(data);
}
