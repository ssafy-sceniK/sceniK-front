import { getCurrentLocale } from './index.js';

const CATEGORY_KEYS = new Map([
  ['드라마', 'drama'], ['영화', 'movie'], ['예능', 'variety'], ['아이돌', 'idol'], ['배우', 'actor'], ['촬영지', 'filmingLocation'],
  ['카페', 'cafe'], ['맛집', 'restaurant'], ['공원', 'park'], ['거리', 'street'], ['학교', 'school'], ['호텔', 'hotel'],
]);

const REGION_KEYS = new Map([
  ['서울', 'seoul'], ['부산', 'busan'], ['인천', 'incheon'], ['경기', 'gyeonggi'], ['강원', 'gangwon'], ['제주', 'jeju'], ['충남', 'chungnam'],
]);

const PREFERENCE_THEME_KEYS = new Map([
  ['감성 여행', 'sentimental'],
  ['맛집 중심', 'food'],
  ['촬영지 중심', 'filming'],
  ['숨은 명소', 'hidden'],
]);

const CONTENT_TRANSLATIONS = {
  C_DRAMA_001: { en: { title: 'Lovely Runner' }, ja: { title: 'ソンジェ背負って走れ' }, 'zh-CN': { title: '背着善宰跑' } },
  C_DRAMA_002: { en: { title: 'Queen of Tears' }, ja: { title: '涙の女王' }, 'zh-CN': { title: '泪之女王' } },
  C_DRAMA_004: { en: { title: 'Squid Game' }, ja: { title: 'イカゲーム' }, 'zh-CN': { title: '鱿鱼游戏' } },
  C_DRAMA_005: { en: { title: 'Goblin' }, ja: { title: 'トッケビ' }, 'zh-CN': { title: '孤单又灿烂的神－鬼怪' } },
  C_DRAMA_006: { en: { title: 'Hometown Cha-Cha-Cha' }, ja: { title: '海街チャチャチャ' }, 'zh-CN': { title: '海岸村恰恰恰' } },
  C_DRAMA_007: { en: { title: 'Our Beloved Summer' }, ja: { title: 'その年、私たちは' }, 'zh-CN': { title: '那年，我们的夏天' } },
  C_MOVIE_004: { en: { title: 'KPop Demon Hunters' }, ja: { title: 'KPop Demon Hunters' }, 'zh-CN': { title: 'KPop Demon Hunters' } },
  C_MOVIE_005: { en: { title: 'Decision to Leave' }, ja: { title: '別れる決心' }, 'zh-CN': { title: '分手的决心' } },
};

function translateOrFallback(path, fallback, t, locale) {
  if (!path || !t || locale === 'ko') return fallback;
  const translated = t(path);
  return translated === path ? fallback : translated;
}

export function localizeSystemLabel(value, kind, t, locale = getCurrentLocale()) {
  const source = String(value ?? '').trim();
  if (!source) return source;
  const key = kind === 'region' ? REGION_KEYS.get(source) : CATEGORY_KEYS.get(source);
  if (!key) return source;
  const path = kind === 'region' ? 'content.region.' + key : 'content.category.' + key;
  return translateOrFallback(path, source, t, locale);
}

export function localizePreferenceOption(group, value, t, locale = getCurrentLocale()) {
  const source = String(value ?? '').trim();
  if (!source) return source;
  if (group === 'regions') return localizeSystemLabel(source, 'region', t, locale);
  if (group === 'contentTypes') {
    const key = CATEGORY_KEYS.get(source);
    return translateOrFallback(key ? 'preferences.options.contentTypes.' + key : '', source, t, locale);
  }
  const themeKey = PREFERENCE_THEME_KEYS.get(source);
  return translateOrFallback(themeKey ? 'preferences.options.themes.' + themeKey : '', source, t, locale);
}

export function localizeContent(content, locale = getCurrentLocale()) {
  if (!content || locale === 'ko') return content;
  const translated = CONTENT_TRANSLATIONS[content.contentId]?.[locale];
  if (!translated) return content;
  return {
    ...content,
    title: translated.title ?? content.title,
  };
}

export function localizePlace(place, locale = getCurrentLocale(), t) {
  if (!place) return place;
  return {
    ...place,
    region: localizeSystemLabel(place.region, 'region', t, locale),
    category: localizeSystemLabel(place.category, 'category', t, locale),
  };
}

export const systemContentCoverage = {
  localizedContentCount: Object.keys(CONTENT_TRANSLATIONS).length,
  localizedPlaceCount: 0,
  localizedCategoryTagCount: CATEGORY_KEYS.size + REGION_KEYS.size + PREFERENCE_THEME_KEYS.size,
};
