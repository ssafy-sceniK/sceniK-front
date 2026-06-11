const CONTENT_IMAGE_PLACEHOLDER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="360" height="520" viewBox="0 0 360 520">
  <rect width="360" height="520" rx="28" fill="#f4f7fb"/>
  <circle cx="180" cy="206" r="58" fill="#e3edff"/>
  <path d="M122 252c31-39 52-45 82-18 18 16 30 20 45 10 13-9 25-3 38 19" fill="none" stroke="#2563eb" stroke-width="12" stroke-linecap="round"/>
  <path d="M132 209h96" stroke="#9db7f4" stroke-width="10" stroke-linecap="round" stroke-dasharray="2 21"/>
  <text x="180" y="328" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#1f2a44">sceniK</text>
</svg>
`.trim();

export const CONTENT_IMAGE_PLACEHOLDER = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(CONTENT_IMAGE_PLACEHOLDER_SVG)}`;

export function getContentImageUrl(content = {}) {
  return [
    content.thumbnailUrl,
    content.posterUrl,
    content.imageUrl,
    content.thumbnail,
    content.image,
  ].find((value) => typeof value === 'string' && value.trim())?.trim()
    ?? CONTENT_IMAGE_PLACEHOLDER;
}

export function applyNeutralContentImageFallback(event) {
  const image = event.currentTarget;
  if (image.dataset.fallbackApplied === 'neutral') return;
  image.dataset.fallbackApplied = 'neutral';
  image.src = CONTENT_IMAGE_PLACEHOLDER;
}
