const WEB_SAFE_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const IMAGE_EXTENSION_PATTERN = /\.(jpe?g|png|webp|gif|heic|heif)$/i;
const MIME_BY_EXTENSION = new Map([
  ['jpg', 'image/jpeg'],
  ['jpeg', 'image/jpeg'],
  ['png', 'image/png'],
  ['webp', 'image/webp'],
  ['gif', 'image/gif'],
]);
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_CANVAS_EDGE = 2400;

function fileExtension(file) {
  const match = String(file?.name ?? '').toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? '';
}

function inferredMimeType(file) {
  const type = String(file?.type ?? '').toLowerCase();
  if (type) return type;
  return MIME_BY_EXTENSION.get(fileExtension(file)) ?? '';
}

export function isCommunityImageCandidateFile(file) {
  if (!file) return false;
  const type = String(file.type ?? '').toLowerCase();
  return type.startsWith('image/') || IMAGE_EXTENSION_PATTERN.test(file.name ?? '');
}

export function isHeicLikeFile(file) {
  const type = String(file?.type ?? '').toLowerCase();
  const extension = fileExtension(file);
  return type === 'image/heic'
    || type === 'image/heif'
    || type === 'image/heic-sequence'
    || type === 'image/heif-sequence'
    || extension === 'heic'
    || extension === 'heif';
}

function jpegFileName(file) {
  const baseName = String(file?.name || 'iphone-photo')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${baseName || 'iphone-photo'}.jpg`;
}

function imageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('IMAGE_DECODE_FAILED'));
    };
    image.src = url;
  });
}

function scaledSize(width, height) {
  const maxEdge = Math.max(width, height);
  if (!maxEdge || maxEdge <= MAX_CANVAS_EDGE) {
    return { width, height };
  }
  const scale = MAX_CANVAS_EDGE / maxEdge;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('IMAGE_CONVERSION_FAILED'));
    }, 'image/jpeg', quality);
  });
}

async function convertHeicToJpeg(file) {
  const image = await imageFromFile(file);
  const { width, height } = scaledSize(image.naturalWidth || image.width, image.naturalHeight || image.height);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('CANVAS_UNSUPPORTED');
  context.drawImage(image, 0, 0, width, height);

  for (const quality of [0.88, 0.78, 0.68]) {
    const blob = await canvasToBlob(canvas, quality);
    if (blob.size <= MAX_UPLOAD_BYTES || quality === 0.68) {
      if (blob.size > MAX_UPLOAD_BYTES) {
        throw new Error('CONVERTED_IMAGE_TOO_LARGE');
      }
      return new File([blob], jpegFileName(file), {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });
    }
  }
  throw new Error('IMAGE_CONVERSION_FAILED');
}

function withInferredType(file) {
  const type = inferredMimeType(file);
  if (!type || file.type) return file;
  return new File([file], file.name || 'image', {
    type,
    lastModified: file.lastModified || Date.now(),
  });
}

export async function normalizeCommunityImageFile(file) {
  if (!isCommunityImageCandidateFile(file)) {
    throw new Error('UNSUPPORTED_IMAGE_TYPE');
  }
  if (isHeicLikeFile(file)) {
    return convertHeicToJpeg(file);
  }
  const normalized = withInferredType(file);
  if (!WEB_SAFE_IMAGE_TYPES.has(inferredMimeType(normalized))) {
    throw new Error('UNSUPPORTED_IMAGE_TYPE');
  }
  return normalized;
}
