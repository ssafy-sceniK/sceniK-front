export const PREFERENCE_CONTENT_TYPES = ['\ub4dc\ub77c\ub9c8', '\uc601\ud654', '\uc544\uc774\ub3cc', '\uc608\ub2a5', '\ubc30\uc6b0'];
export const PREFERENCE_REGIONS = ['\uc11c\uc6b8', '\ubd80\uc0b0', '\uc81c\uc8fc', '\uacbd\uae30', '\uac15\uc6d0', '\uc778\ucc9c'];
export const PREFERENCE_THEMES = ['\uac10\uc131 \uc5ec\ud589', '\ub9db\uc9d1 \uc911\uc2ec', '\ucd2c\uc601\uc9c0 \uc911\uc2ec', '\uc228\uc740 \uba85\uc18c'];

const LEGACY_VALUE_MAP = new Map([
  ['?\uc495\uc52a\uf9cd?', '\ub4dc\ub77c\ub9c8'],
  ['?\uacf9\uc195', '\uc601\ud654'],
  ['?\uafa9\uc520??', '\uc544\uc774\ub3cc'],
  ['?\ub348\ub4ab', '\uc608\ub2a5'],
  ['\u8adb\uacd7\uc2a6', '\ubc30\uc6b0'],
  ['?\uc496\uc2b1', '\uc11c\uc6b8'],
  ['遺??', '\ubd80\uc0b0'],
  ['?\uc496\uff1c', '\uc81c\uc8fc'],
  ['\u5bc3\uc384\ub9b0', '\uacbd\uae30'],
  ['\u5a9b\ubea4\uc35d', '\uac15\uc6d0'],
  ['?\uba84\ucfc7', '\uc778\ucc9c'],
  ['\u5a9b\uba2f\uaf66 ?\u044b\ubefe', '\uac10\uc131 \uc5ec\ud589'],
  ['\uf9cd\uc3c6\ucb5b \u4ee5\ubb12\ub596', '\ub9db\uc9d1 \uc911\uc2ec'],
  ['\u73e5\u044a\uc07a\uf9de\u0080 \u4ee5\ubb12\ub596', '\ucd2c\uc601\uc9c0 \uc911\uc2ec'],
  ['?\uae46??\uc495?', '\uc228\uc740 \uba85\uc18c'],
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
