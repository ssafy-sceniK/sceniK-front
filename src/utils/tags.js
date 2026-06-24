const tagFromCodePoints = (prefix, ...codePoints) =>
  `${prefix}${String.fromCodePoint(...codePoints)}`;

const GENERIC_AI_COURSE_TOKENS = new Set([
  tagFromCodePoints('ai', 0xcf54, 0xc2a4),
  'aicourse',
  tagFromCodePoints('ai', 0x30b3, 0x30fc, 0x30b9),
  tagFromCodePoints('ai', 0x884c, 0x7a0b),
  tagFromCodePoints('ai', 0x8def, 0x7ebf),
]);

function tagToken(value) {
  return String(value ?? '')
    .trim()
    .replace(/^#+/, '')
    .replace(/\s+/g, '')
    .toLowerCase();
}

export function isGenericAiCourseTag(tag) {
  return GENERIC_AI_COURSE_TOKENS.has(tagToken(tag));
}

export function filterGenericAiCourseTags(tags = []) {
  return tags.filter((tag) => !isGenericAiCourseTag(tag));
}
