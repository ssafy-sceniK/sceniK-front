import { http } from './http.js';

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function normalizeCandidatePlace(place = {}, fallback = {}) {
  const placeId = firstDefined(place.placeId, fallback.placeId);
  const name = firstDefined(place.name, place.placeName, fallback.placeName, fallback.name, '검증 장소');
  return {
    ...place,
    placeId,
    name,
    placeName: firstDefined(place.placeName, name),
    region: firstDefined(place.region, fallback.region, 'Korea'),
    category: firstDefined(place.category, fallback.category, '검증 장소'),
    address: firstDefined(place.address, fallback.address, '검증 장소 주소'),
    latitude: Number(firstDefined(place.latitude, fallback.latitude, 37.5665)),
    longitude: Number(firstDefined(place.longitude, fallback.longitude, 126.9780)),
    relatedContentId: firstDefined(place.relatedContentId, fallback.relatedContentId, 'content-local'),
    relatedContentTitle: firstDefined(place.relatedContentTitle, fallback.relatedContentTitle, 'sceniK content'),
    sceneDescription: firstDefined(place.sceneDescription, place.description, fallback.sceneDescription, 'Verified sceniK place.'),
    verified: place.verified !== false,
    imageUrl: firstDefined(place.imageUrl, fallback.imageUrl),
  };
}

function stopSource(stop = {}) {
  return stop.place ?? stop.placeDto ?? stop.placeInfo ?? stop;
}

function normalizeStop(stop = {}, dayNumber, stopIndex, candidateMap) {
  const place = normalizeCandidatePlace(stopSource(stop), stop);
  return {
    ...stop,
    placeId: place.placeId,
    placeName: firstDefined(stop.placeName, stop.name, place.placeName, place.name),
    dayNumber,
    visitOrder: Number(firstDefined(stop.visitOrder, stop.order, stop.sequence, stopIndex + 1)),
    recommendedTime: firstDefined(stop.recommendedTime, stop.time, '10:00'),
    reason: firstDefined(stop.reason, stop.description, `${place.name} is part of a verified sceniK route.`),
    travelTip: firstDefined(stop.travelTip, stop.tip, 'Check opening hours and transit before visiting.'),
  };
}

function sourceDays(route = {}) {
  if (Array.isArray(route.days)) return route.days;
  if (Array.isArray(route.routeDays)) return route.routeDays;
  if (Array.isArray(route.itineraryDays)) return route.itineraryDays;
  const routePlaces = Array.isArray(route.routePlaces) ? route.routePlaces : [];
  if (routePlaces.length) {
    const grouped = routePlaces.reduce((acc, item) => {
      const dayNumber = Number(firstDefined(item.dayNumber, item.day, 1));
      if (!acc.has(dayNumber)) acc.set(dayNumber, []);
      acc.get(dayNumber).push(item);
      return acc;
    }, new Map());
    return [...grouped.entries()].map(([dayNumber, places]) => ({ dayNumber, places }));
  }
  return [];
}

export function normalizeRoutePayload(rawRoute) {
  const route = rawRoute?.route ?? rawRoute?.data ?? rawRoute;
  if (!route) return null;

  const candidateMap = new Map();
  (route.candidatePlaces ?? []).forEach((place) => {
    const candidate = normalizeCandidatePlace(place);
    if (candidate.placeId) candidateMap.set(candidate.placeId, candidate);
  });

  const days = sourceDays(route).map((day, dayIndex) => {
    const dayNumber = Number(firstDefined(day.dayNumber, day.day, dayIndex + 1));
    const places = (day.places ?? day.stops ?? day.routePlaces ?? []).map((stop, stopIndex) => (
      normalizeStop(stop, dayNumber, stopIndex, candidateMap)
    ));
    return {
      ...day,
      dayNumber,
      estimatedTravelTime: firstDefined(day.estimatedTravelTime, day.travelTime, day.estimatedMoveTime),
      places,
    };
  }).filter((day) => day.places.length);

  const routePlaceIds = [...new Set(days.flatMap((day) => day.places.map((place) => place.placeId)).filter(Boolean))];
  const candidatePlaces = [...candidateMap.values()];
  const durationDays = Number(firstDefined(route.durationDays, route.duration, route.dayCount, days.length, 1));
  const routeId = firstDefined(route.routeId, route.id);

  return {
    ...route,
    routeId,
    id: route.id ?? routeId,
    title: firstDefined(route.title, route.routeTitle, 'sceniK AI Course'),
    summary: firstDefined(route.summary, route.description, 'Verified sceniK places connected into a travel course.'),
    region: firstDefined(route.region, candidatePlaces[0]?.region, 'Korea'),
    durationDays,
    duration: Number(firstDefined(route.duration, durationDays)),
    transport: firstDefined(route.transport, 'Transit'),
    style: firstDefined(route.style, route.theme, 'K-content travel'),
    trustMessage: firstDefined(route.trustMessage, 'This course uses only verified sceniK places.'),
    tags: route.tags ?? ['AI Course', route.region, route.style].filter(Boolean),
    places: route.places ?? routePlaceIds,
    candidatePlaces,
    days,
  };
}

export function serializeRoutePayload(route) {
  const normalized = normalizeRoutePayload(route);
  const flatStops = normalized?.days?.flatMap((day) => (
    (day.places ?? []).map((place, index) => ({
      ...place,
      dayNumber: place.dayNumber ?? day.dayNumber,
      visitOrder: place.visitOrder ?? index + 1,
    }))
  )) ?? [];
  const sourcePlaces = flatStops.length
    ? flatStops
    : (normalized?.places ?? []).map((place, index) => (
      typeof place === 'string'
        ? { placeId: place, dayNumber: 1, visitOrder: index + 1 }
        : place
    ));
  return {
    ...normalized,
    routeId: normalized?.routeId,
    candidatePlaces: normalized?.candidatePlaces ?? [],
    places: sourcePlaces,
    days: normalized?.days ?? [],
  };
}

export async function fetchMyRoutes() {
  const { data } = await http.get('/users/me/routes');
  const list = Array.isArray(data) ? data : data.routes ?? data.items ?? [];
  return list.map(normalizeRoutePayload).filter(Boolean);
}

export async function createRoute(route) {
  const { data } = await http.post('/routes', serializeRoutePayload(route));
  return normalizeRoutePayload(data);
}

export async function fetchRoute(routeId) {
  const { data } = await http.get(`/routes/${routeId}`);
  return normalizeRoutePayload(data);
}

export async function updateRoute(routeId, route) {
  const { data } = await http.patch(`/routes/${routeId}`, serializeRoutePayload(route));
  return normalizeRoutePayload(data);
}

export async function deleteRoute(routeId) {
  await http.delete(`/routes/${routeId}`);
  return true;
}

export async function addRoutePlace(routeId, payload) {
  const { data } = await http.post(`/routes/${routeId}/places`, payload);
  return normalizeRoutePayload(data);
}

export async function updateRoutePlace(routeId, routePlaceId, payload) {
  const { data } = await http.patch(`/routes/${routeId}/places/${routePlaceId}`, payload);
  return normalizeRoutePayload(data);
}

export async function deleteRoutePlace(routeId, routePlaceId) {
  const { data } = await http.delete(`/routes/${routeId}/places/${routePlaceId}`);
  return normalizeRoutePayload(data);
}

export async function reorderRoutePlaces(routeId, payload) {
  const { data } = await http.patch(`/routes/${routeId}/places/reorder`, payload);
  return normalizeRoutePayload(data);
}
