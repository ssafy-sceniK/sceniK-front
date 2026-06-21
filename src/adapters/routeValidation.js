const requiredCandidateFields = [
  'placeId',
  'name',
  'region',
  'category',
  'address',
  'latitude',
  'longitude',
  'relatedContentId',
  'relatedContentTitle',
  'sceneDescription',
  'verified',
];

const requiredStopFields = ['placeId', 'dayNumber', 'visitOrder', 'recommendedTime', 'reason', 'travelTip'];

export const AI_ROUTE_VALIDATION_USER_MESSAGE = '코스 장소 정보가 올바르지 않습니다. 다시 생성해 주세요.';

function isMissing(value) {
  return value === undefined || value === null || value === '';
}

function normalizeRegion(value) {
  const normalized = String(value ?? '').replace(/\s+/g, '');
  if (normalized.startsWith('서울')) return '서울';
  if (normalized.startsWith('부산')) return '부산';
  if (normalized.startsWith('인천')) return '인천';
  if (normalized.startsWith('대구')) return '대구';
  if (normalized.startsWith('대전')) return '대전';
  if (normalized.startsWith('광주')) return '광주';
  if (normalized.startsWith('울산')) return '울산';
  if (normalized.startsWith('세종')) return '세종';
  if (normalized.startsWith('경기')) return '경기';
  if (normalized.startsWith('강원')) return '강원';
  if (normalized.startsWith('충북') || normalized.startsWith('충청북도')) return '충북';
  if (normalized.startsWith('충남') || normalized.startsWith('충청남도')) return '충남';
  if (normalized.startsWith('전북') || normalized.startsWith('전라북도')) return '전북';
  if (normalized.startsWith('전남') || normalized.startsWith('전라남도')) return '전남';
  if (normalized.startsWith('경북') || normalized.startsWith('경상북도')) return '경북';
  if (normalized.startsWith('경남') || normalized.startsWith('경상남도')) return '경남';
  if (normalized.startsWith('제주')) return '제주';
  return normalized;
}

function requestRegions(request = {}) {
  if (Array.isArray(request.regions) && request.regions.length) {
    return request.regions.map(normalizeRegion).filter(Boolean);
  }
  return String(request.region ?? '').split(/[,.·]/).map((region) => normalizeRegion(region)).filter(Boolean);
}

export function validateAiRoute(route, candidatePlaces, request) {
  const errors = [];

  if (!route || !Array.isArray(route.days) || route.days.length === 0) {
    return {
      ok: false,
      errors: ['Route must include at least one day.'],
    };
  }

  const candidateList = Array.isArray(candidatePlaces) ? candidatePlaces : [];

  if (candidateList.length === 0) {
    errors.push('Candidate place list must include at least one verified place.');
  }

  const candidateIds = new Set();

  candidateList.forEach((place) => {
    requiredCandidateFields.forEach((field) => {
      if (isMissing(place[field])) {
        errors.push(`Candidate place ${place.placeId ?? 'unknown'} is missing ${field}.`);
      }
    });

    if (place.verified !== true) {
      errors.push(`Candidate place ${place.placeId} is not verified.`);
    }

    const regions = requestRegions(request);
    if (request.strictRegion === true && regions.length && !regions.includes(normalizeRegion(place.region)) && !regions.includes(normalizeRegion(place.address))) {
      errors.push(`Candidate place ${place.placeId} does not match selected regions ${regions.join(',')}.`);
    }

    if (candidateIds.has(place.placeId)) {
      errors.push(`Duplicate candidate placeId: ${place.placeId}.`);
    }

    candidateIds.add(place.placeId);
  });

  const expectedDays = Number(request.durationDays || route.days.length || 0);

  if (expectedDays && route.days.length !== expectedDays) {
    errors.push(`Route day count must match selected duration: ${expectedDays}.`);
  }

  const dayNumbers = new Set();
  const routePlaceIds = new Set();

  route.days.forEach((day, dayIndex) => {
    const expectedDayNumber = dayIndex + 1;

    if (!Number.isInteger(day.dayNumber) || day.dayNumber < 1 || day.dayNumber > expectedDays) {
      errors.push(`Invalid dayNumber: ${day.dayNumber}.`);
    }

    if (day.dayNumber !== expectedDayNumber) {
      errors.push(`dayNumber must be sequential. Expected ${expectedDayNumber}, got ${day.dayNumber}.`);
    }

    if (dayNumbers.has(day.dayNumber)) {
      errors.push(`Duplicate dayNumber: ${day.dayNumber}.`);
    }

    dayNumbers.add(day.dayNumber);

    if (!Array.isArray(day.places) || day.places.length === 0) {
      errors.push(`Day ${day.dayNumber} must include at least one place.`);
      return;
    }

    const orders = new Set();

    day.places.forEach((stop, stopIndex) => {
      const expectedVisitOrder = stopIndex + 1;

      requiredStopFields.forEach((field) => {
        if (isMissing(stop[field])) {
          errors.push(`Missing ${field} for day ${day.dayNumber}.`);
        }
      });

      if (!candidateIds.has(stop.placeId)) {
        errors.push(`Unknown placeId outside candidate list: ${stop.placeId}.`);
      }

      if (routePlaceIds.has(stop.placeId)) {
        errors.push(`Duplicate route placeId: ${stop.placeId}.`);
      }

      routePlaceIds.add(stop.placeId);

      if (stop.dayNumber !== day.dayNumber) {
        errors.push(`Stop ${stop.placeId} has mismatched dayNumber.`);
      }

      if (!Number.isInteger(stop.visitOrder) || stop.visitOrder < 1) {
        errors.push(`Invalid visitOrder for ${stop.placeId}.`);
      }

      if (stop.visitOrder !== expectedVisitOrder) {
        errors.push(
          `visitOrder must be sequential on day ${day.dayNumber}. Expected ${expectedVisitOrder}, got ${stop.visitOrder}.`,
        );
      }

      if (orders.has(stop.visitOrder)) {
        errors.push(`Duplicate visitOrder ${stop.visitOrder} on day ${day.dayNumber}.`);
      }

      orders.add(stop.visitOrder);
    });
  });

  return {
    ok: errors.length === 0,
    errors,
  };
}
