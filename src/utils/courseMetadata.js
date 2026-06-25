function firstText(...values) {
  return values
    .map((value) => String(value ?? '').trim())
    .find(Boolean) ?? '';
}

function numberFrom(...values) {
  return values
    .map(Number)
    .find((value) => Number.isFinite(value) && value > 0) ?? 0;
}

function routePlaceCount(course = {}) {
  const dayPlaces = Array.isArray(course.days)
    ? course.days.flatMap((day) => day?.places ?? [])
    : [];

  return numberFrom(
    course.placeCount,
    course.totalPlaces,
    course.totalPlaceCount,
    dayPlaces.length,
    Array.isArray(course.places) ? course.places.length : 0,
    Array.isArray(course.candidatePlaces) ? course.candidatePlaces.length : 0,
  );
}

function durationLabel(course = {}, t) {
  const value = firstText(course.durationDays, course.duration);
  if (!value) return '';
  const dayMatch = value.match(/\d+/);
  return dayMatch ? t('course.detail.durationDays', { count: Number(dayMatch[0]) }) : value;
}

function isMarketingMeta(value) {
  const text = String(value ?? '').trim().toLowerCase();
  if (!text) return true;
  return text.includes('verified place')
    || text.includes('\uac80\uc99d')
    || text.includes('scenik db')
    || text.includes('k-content travel');
}

export function courseMetadataItems(course = {}, t) {
  const region = firstText(course.region, Array.isArray(course.regions) ? course.regions.join(', ') : '');
  const duration = durationLabel(course, t);
  const places = routePlaceCount(course);
  const placeCount = places ? t('course.detail.placeCount', { count: places }) : '';
  const transport = firstText(course.transportLabel, course.transport);
  const style = firstText(
    Array.isArray(course.travelStyles) ? course.travelStyles[0] : '',
    course.style,
    Array.isArray(course.tags) ? course.tags[0] : '',
  );

  return [region, duration, placeCount, transport, style]
    .filter((item) => !isMarketingMeta(item))
    .slice(0, 3);
}

export function formatCourseMetadata(course = {}, t) {
  return courseMetadataItems(course, t).join(' \u00b7 ');
}
