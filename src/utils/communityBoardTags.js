const BOARD_TAG_PREFIX = '__board:';
const BOARD_IDS = new Set(['drama', 'movie', 'idol', 'variety', 'region']);

export function communityBoardTag(boardId) {
  const id = String(boardId || '').trim().toLowerCase();
  return BOARD_IDS.has(id) ? BOARD_TAG_PREFIX + id : '';
}

export function isCommunityBoardTag(tag) {
  return String(tag || '').startsWith(BOARD_TAG_PREFIX);
}

export function communityBoardIdFromTag(tag) {
  const id = String(tag || '').slice(BOARD_TAG_PREFIX.length).trim().toLowerCase();
  return BOARD_IDS.has(id) ? id : '';
}

export function communityBoardIdFromTags(tags = []) {
  for (const tag of tags) {
    const id = communityBoardIdFromTag(tag);
    if (id) return id;
  }
  return '';
}
