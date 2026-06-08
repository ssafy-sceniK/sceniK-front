import { createPinia, setActivePinia } from 'pinia';
import { generateAiRoute } from '../src/api/aiApi.js';
import { login, saveAccessToken, signup } from '../src/api/authApi.js';
import { fetchMyRoutes, fetchRoute, updateRoute } from '../src/api/routeApi.js';
import { http } from '../src/api/http.js';
import { validateAiRoute } from '../src/adapters/routeValidation.js';
import { contents, places } from '../src/data/mockData.js';
import { useUiStore } from '../src/stores/uiStore.js';

const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.delete(key),
};
globalThis.window = {
  setTimeout: () => 0,
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function jsonBody(config) {
  if (!config.data) return {};
  return typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
}

function response(config, data, status = 200) {
  return Promise.resolve({
    data,
    status,
    statusText: status === 204 ? 'No Content' : 'OK',
    headers: {},
    config,
  });
}

function makeCandidate(place, content) {
  return {
    placeId: place.placeId,
    name: place.placeName,
    placeName: place.placeName,
    region: place.region,
    category: place.category,
    address: place.address,
    latitude: place.latitude,
    longitude: place.longitude,
    relatedContentId: content.contentId,
    relatedContentTitle: content.title,
    sceneDescription: place.description ?? 'Verified sceniK place.',
    verified: true,
    imageUrl: place.imageUrl,
    thumbnailUrl: place.thumbnailUrl ?? place.imageUrl,
  };
}

function chooseCandidates() {
  const content = contents[0];
  const groups = places
    .filter((place) => place.verified === true)
    .reduce((acc, place) => {
      if (!acc.has(place.region)) acc.set(place.region, []);
      acc.get(place.region).push(place);
      return acc;
    }, new Map());
  const sameRegion = [...groups.values()].find((group) => group.length >= 2);
  assert(sameRegion, 'mock data must include at least two verified places in one region');
  return {
    content,
    candidates: sameRegion.slice(0, 4).map((place) => makeCandidate(place, content)),
  };
}

function makeAiRoute(payload) {
  const { content, candidates } = chooseCandidates();
  const durationDays = Math.max(1, Math.min(Number(payload.durationDays ?? 2), candidates.length));
  const days = Array.from({ length: durationDays }, (_, dayIndex) => ({
    dayNumber: dayIndex + 1,
    estimatedTravelTime: dayIndex === 0 ? 'About 58 min' : 'About 74 min',
    places: [
      {
        placeId: candidates[dayIndex].placeId,
        placeName: candidates[dayIndex].name,
        dayNumber: dayIndex + 1,
        visitOrder: 1,
        name: candidates[dayIndex].name,
        address: candidates[dayIndex].address,
        latitude: candidates[dayIndex].latitude,
        longitude: candidates[dayIndex].longitude,
        recommendedTime: '10:00',
        recommendReason: `${candidates[dayIndex].relatedContentTitle} verified route stop.`,
        reason: `${candidates[dayIndex].relatedContentTitle} verified route stop.`,
        estimatedStayMinutes: 90,
        estimatedTravelMinutes: dayIndex === 0 ? 28 : 36,
        travelTip: 'Check opening hours and local transit before visiting.',
      },
    ],
  }));
  return {
    generationId: 'gen-smoke-route',
    routeId: 'ai-smoke-route',
    title: `${content.title} ${candidates[0].region} route`,
    summary: 'Verified sceniK API smoke route.',
    contentId: content.contentId,
    contentIds: [content.contentId],
    contentTitle: content.title,
    region: candidates[0].region,
    durationDays,
    requestedDurationDays: durationDays,
    transport: 'PUBLIC_TRANSIT',
    companion: 'FRIENDS',
    style: 'SCENIC',
    trustMessage: 'Only verified places from the candidate list are used.',
    candidatePlaces: candidates,
    days,
  };
}

const db = {
  users: [],
  tokens: new Map(),
  routes: [],
  lastSavedRoutePayload: null,
};

function requireToken(config) {
  const header = config.headers?.Authorization ?? config.headers?.authorization;
  const token = typeof header === 'string' && header.startsWith('Bearer ') ? header.slice(7) : '';
  const user = db.tokens.get(token);
  assert(user, 'request must include a valid mocked bearer token');
  return user;
}

http.defaults.adapter = async (config) => {
  const method = (config.method ?? 'get').toUpperCase();
  const url = config.url ?? '';
  const body = jsonBody(config);

  if (method === 'POST' && url === '/auth/signup') {
    const user = {
      id: db.users.length + 1,
      userId: db.users.length + 1,
      email: body.email,
      nickname: body.nickname,
    };
    const token = `token-${user.userId}`;
    db.users.push({ ...user, password: body.password });
    db.tokens.set(token, user);
    return response(config, { accessToken: token, refreshToken: token, user });
  }

  if (method === 'POST' && url === '/auth/login') {
    const user = db.users.find((item) => item.email === body.email && item.password === body.password);
    assert(user, 'mocked login should find the signed-up user');
    const token = `token-login-${user.userId}`;
    db.tokens.set(token, user);
    return response(config, { accessToken: token, refreshToken: token, user });
  }

  if (method === 'POST' && url === '/ai/routes') {
    return response(config, makeAiRoute(body));
  }

  if (method === 'POST' && url === '/routes') {
    const user = requireToken(config);
    const routeId = `route-${db.routes.length + 1}`;
    db.lastSavedRoutePayload = body;
    const saved = {
      ...body,
      routeId,
      id: routeId,
      userId: user.userId,
      days: body.days.map((day) => ({
        ...day,
        places: day.places.map((place, index) => ({
          ...place,
          routePlaceId: `${routeId}-place-${day.dayNumber}-${index + 1}`,
        })),
      })),
    };
    db.routes.push(saved);
    return response(config, saved);
  }

  if (method === 'GET' && url === '/users/me/routes') {
    const user = requireToken(config);
    return response(config, db.routes.filter((route) => route.userId === user.userId));
  }

  const routeMatch = url.match(/^\/routes\/([^/]+)$/);
  if (routeMatch && method === 'GET') {
    requireToken(config);
    const route = db.routes.find((item) => item.routeId === routeMatch[1]);
    assert(route, 'saved route detail should exist');
    return response(config, route);
  }

  if (routeMatch && method === 'PATCH') {
    requireToken(config);
    const index = db.routes.findIndex((item) => item.routeId === routeMatch[1]);
    assert(index >= 0, 'saved route should exist before update');
    db.routes[index] = { ...db.routes[index], ...body, routeId: routeMatch[1] };
    return response(config, db.routes[index]);
  }

  throw new Error(`Unhandled mocked request: ${method} ${url}`);
};

setActivePinia(createPinia());
const uiStore = useUiStore();

const email = `course-smoke-${Date.now()}@example.com`;
const password = 'password123';
const signupSession = await signup({ email, password, nickname: 'Course Smoke' });
assert(signupSession.accessToken, 'signup should return an access token');

const loginSession = await login({ email, password });
assert(loginSession.user.email === email, 'login should return the signed-up user');
saveAccessToken(loginSession.accessToken, loginSession.refreshToken);
uiStore.currentUser = loginSession.user;

const generated = await generateAiRoute({
  contentIds: [contents[0].contentId],
  durationDays: 2,
  transport: 'PUBLIC_TRANSIT',
  companion: 'FRIENDS',
  style: 'SCENIC',
});

const generatedValidation = validateAiRoute(generated, generated.candidatePlaces, {
  region: generated.region,
  durationDays: generated.durationDays,
});
assert(generatedValidation.ok, `generated route should validate: ${generatedValidation.errors.join(', ')}`);

uiStore.generatedRoute = generated;
const saved = await uiStore.saveCourse(generated);
assert(saved?.routeId?.startsWith('route-'), 'valid route should be saved with a backend routeId');
assert(uiStore.generatedRoute?.routeId === saved.routeId, 'saved backend routeId should update generatedRoute');
assert(db.lastSavedRoutePayload, 'route save should send a backend payload');
assert(db.lastSavedRoutePayload.durationDays === generated.durationDays, 'route save payload should preserve durationDays');
assert(db.lastSavedRoutePayload.days?.[0]?.places?.[0]?.placeId, 'route save payload should include real placeId values');
assert(
  !Array.isArray(db.lastSavedRoutePayload.places)
    || db.lastSavedRoutePayload.places.every((place) => typeof place === 'object' && place.placeId),
  'route save payload should not send legacy string-only places when days are present',
);
assert(db.lastSavedRoutePayload.candidatePlaces?.every((place) => place.placeId), 'route save payload should preserve candidate place IDs');
const persistedUiState = JSON.parse(storage.get('scenik-vue-mvp-state') ?? '{}');
assert(!Array.isArray(persistedUiState.savedCourses), 'saved routes should not be persisted as UI localStorage business data');
assert(!Array.isArray(persistedUiState.communityPosts), 'community posts should not be persisted as UI localStorage business data');

const routes = await fetchMyRoutes();
assert(routes.length === 1, 'route list should include the saved route');
assert(routes[0].routeId === saved.routeId, 'route list should preserve saved routeId');

const detail = await fetchRoute(saved.routeId);
assert(detail.routeId === saved.routeId, 'route detail should load by saved routeId');

const updated = await updateRoute(saved.routeId, {
  ...detail,
  title: `${detail.title} - Edited`,
});
assert(updated.title.endsWith('Edited'), 'route update should persist through the API flow');

console.log('Course API smoke check passed');
