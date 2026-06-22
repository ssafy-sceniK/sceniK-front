export const PREFERENCE_CONTENT_TYPES = ['드라마', '영화', '아이돌', '예능', '배우'];
export const PREFERENCE_REGIONS = ['서울', '부산', '제주', '경기', '강원', '인천'];
export const PREFERENCE_THEMES = ['감성 여행', '맛집 중심', '촬영지 중심', '숨은 명소'];

const LEGACY_VALUE_MAP = new Map([
  ['?쒕씪留?', '드라마'],
  ['?곹솕', '영화'],
  ['?꾩씠??', '아이돌'],
  ['?덈뒫', '예능'],
  ['諛곗슦', '배우'],
  ['?쒖슱', '서울'],
  ['遺??', '부산'],
  ['?쒖＜', '제주'],
  ['寃쎄린', '경기'],
  ['媛뺤썝', '강원'],
  ['?몄쿇', '인천'],
  ['媛먯꽦 ?ы뻾', '감성 여행'],
  ['留쏆쭛 以묒떖', '맛집 중심'],
  ['珥ъ쁺吏 以묒떖', '촬영지 중심'],
  ['?깆??쒕?', '숨은 명소'],
]);

const OPTION_GROUPS = [
  ['contentTypes', PREFERENCE_CONTENT_TYPES],
  ['regions', PREFERENCE_REGIONS],
  ['themes', PREFERENCE_THEMES],
];

function normalizePreferenceValue(value) {
  const text = String(value ?? '').trim();
  return LEGACY_VALUE_MAP.get(text) ?? text;
}

function unique(values = []) {
  return [...new Set(values.map(normalizePreferenceValue).filter(Boolean))];
}

export function normalizePreferenceSelection(preferences = {}) {
  const normalized = {
    contentTypes: [],
    regions: [],
    themes: [],
  };

  if (Array.isArray(preferences)) {
    unique(preferences).forEach((item) => {
      const group = OPTION_GROUPS.find(([, options]) => options.includes(item));
      if (group) normalized[group[0]].push(item);
    });
    return normalized;
  }

  if (!preferences || typeof preferences !== 'object') return normalized;

  OPTION_GROUPS.forEach(([key, options]) => {
    const value = preferences[key];
    normalized[key] = unique(Array.isArray(value) ? value : [value]).filter((item) => options.includes(item));
  });
  return normalized;
}

export function flattenPreferenceSelection(preferences = {}) {
  const normalized = normalizePreferenceSelection(preferences);
  return unique([
    ...normalized.contentTypes,
    ...normalized.regions,
    ...normalized.themes,
  ]);
}

export function hasCompletePreferences(preferences = {}) {
  const normalized = normalizePreferenceSelection(preferences);
  return Boolean(
    normalized.contentTypes.length
    && normalized.regions.length
    && normalized.themes.length,
  );
}