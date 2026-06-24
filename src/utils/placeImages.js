const EMPTY_IMAGE_VALUES = new Set(['', '-', 'null', 'NULL', 'N/A', 'n/a']);

function text(value) {
  return String(value ?? '').trim();
}

export function getPlaceImageUrl(place = {}) {
  const candidates = [
    place.imageUrl,
    place.image_url,
    place.thumbnailUrl,
    place.thumbnail_url,
    place.image,
    place.imageURL,
    place.placeImageUrl,
    place.place_image_url,
  ];
  return candidates.map(text).find((value) => value && !EMPTY_IMAGE_VALUES.has(value)) ?? '';
}

export function withNormalizedPlaceImage(place) {
  if (!place) return place;
  const imageUrl = getPlaceImageUrl(place);
  const thumbnailUrl = [place.thumbnailUrl, place.thumbnail_url, imageUrl]
    .map(text)
    .find((value) => value && !EMPTY_IMAGE_VALUES.has(value)) ?? '';
  return {
    ...place,
    imageUrl,
    thumbnailUrl,
  };
}
