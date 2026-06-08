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

    if (request.region && place.region !== request.region) {
      errors.push(`Candidate place ${place.placeId} does not match selected region ${request.region}.`);
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
