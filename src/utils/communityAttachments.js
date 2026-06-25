const IMAGE_EXTENSION_PATTERN = /\.(avif|bmp|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i;

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

export function attachmentUrl(attachment = {}) {
  return firstDefined(
    attachment.url,
    attachment.imageUrl,
    attachment.image_url,
    attachment.fileUrl,
    attachment.file_url,
    attachment.previewUrl,
    attachment.preview_url,
    attachment.thumbnailUrl,
    attachment.thumbnail_url,
    '',
  );
}

export function attachmentName(attachment = {}, fallback = '') {
  return String(firstDefined(
    attachment.name,
    attachment.fileName,
    attachment.file_name,
    fallback,
  ) ?? '');
}

export function attachmentType(attachment = {}) {
  return String(firstDefined(attachment.type, attachment.mimeType, attachment.mime_type, '') ?? '').toLowerCase();
}

export function isDisplayableImageAttachment(attachment = {}) {
  const url = String(attachmentUrl(attachment) ?? '').trim();
  if (!url) return false;

  const type = attachmentType(attachment);
  if (type === 'image' || type.startsWith('image/')) return true;

  const name = attachmentName(attachment);
  return IMAGE_EXTENSION_PATTERN.test(url) || IMAGE_EXTENSION_PATTERN.test(name);
}

export function displayableImageAttachments(attachments = []) {
  return attachments.filter(isDisplayableImageAttachment);
}

export function fallbackFileAttachments(attachments = []) {
  return attachments.filter((attachment) => !isDisplayableImageAttachment(attachment));
}

export function buildEditableAttachments(attachments = []) {
  return attachments.map((attachment, index) => {
    const url = attachmentUrl(attachment);
    const id = firstDefined(attachment.id, attachment.imageId, attachment.image_id, url, `attachment-${index}`);
    return {
      ...attachment,
      id: attachment.id ?? id,
      imageId: attachment.imageId ?? attachment.image_id ?? id,
      url,
      imageUrl: firstDefined(attachment.imageUrl, attachment.image_url, url),
      thumbnailUrl: firstDefined(attachment.thumbnailUrl, attachment.thumbnail_url, url),
      type: firstDefined(attachment.type, attachment.mimeType, attachment.mime_type, 'image'),
      name: attachmentName(attachment, `image-${index + 1}`),
      editKey: `${id}-${index}`,
    };
  });
}

export function moveArrayItem(items = [], index, offset) {
  const nextIndex = index + offset;
  if (index < 0 || index >= items.length || nextIndex < 0 || nextIndex >= items.length) {
    return [...items];
  }
  const next = [...items];
  const [item] = next.splice(index, 1);
  next.splice(nextIndex, 0, item);
  return next;
}
