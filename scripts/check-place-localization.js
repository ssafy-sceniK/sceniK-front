import { places } from '../src/data/mockData.js';
import {
  hasKoreanSyllable,
  isBrokenLocalizedPlaceName,
  placeNameFallbackForLocale,
  romanizeKoreanPlaceName,
} from '../src/i18n/placeNameRomanization.js';

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

function hasBrokenPlaceholder(value) {
  const text = String(value ?? '').trim();
  return !text || /\uFFFD|\?{2,}|^\?+$/.test(text);
}

function isSuspiciousFullRomanization(value) {
  const text = String(value ?? '').trim();
  const compact = text.replace(/\s+/g, '');
  const romanizedSuffix = /(bakmulgwan|misulgwan|munhwagonggan|gongwon|haebyeon|haesuyokjang|yeok|hakgyo|daehakgyo|gung|maeul|geori|sijang)$/i;
  const longUnsegmentedToken = text
    .split(/\s+/)
    .some((token) => /^[A-Z][a-z]{23,}$/.test(token));
  return romanizedSuffix.test(compact) || longUnsegmentedToken;
}

function placeByName(name) {
  return places.find((place) => String(place.placeName).replace(/\s+/g, '') === name.replace(/\s+/g, ''));
}

const seoulLand = places.find((place) => place.placeId === 'P_0002');
const romanizedSeoulLand = romanizeKoreanPlaceName(seoulLand.placeName);
assert(romanizedSeoulLand && romanizedSeoulLand !== seoulLand.placeName, 'unmapped Korean place names should produce a localized fallback');
assert(placeNameFallbackForLocale(seoulLand.placeName, 'en') === romanizedSeoulLand, 'English fallback should be centralized');

const expectedNames = [
  ['북촌동양문화박물관', 'Bukchon Asian Cultural Art Museum'],
  ['한국가구박물관', 'Korea Furniture Museum'],
  ['우리옛돌박물관', 'Korean Stone Art Museum'],
  ['경복궁', 'Gyeongbokgung Palace'],
  ['백인제가옥', 'Baek Inje House'],
  ['양재시민의숲역', "Yangjae Citizen's Forest Station"],
];

for (const [koName, expectedEn] of expectedNames) {
  const place = placeByName(koName) ?? { placeName: koName };
  const fallback = placeNameFallbackForLocale(place.placeName, 'en');
  assert(fallback === expectedEn, `${koName} should localize as ${expectedEn}, got ${fallback}`);
}

let suspiciousCount = 0;
for (const locale of ['en', 'ja', 'zh-CN']) {
  for (const place of places) {
    const fallback = placeNameFallbackForLocale(place.placeName, locale);
    assert(!hasBrokenPlaceholder(fallback), `${locale} ${place.placeId} placeName fallback must not be blank or broken`);
    if (hasKoreanSyllable(place.placeName)) {
      assert(!isBrokenLocalizedPlaceName(fallback, locale), `${locale} ${place.placeId} fallback must be safe for display`);
    }
    if (locale === 'en' && isSuspiciousFullRomanization(fallback)) {
      suspiciousCount += 1;
      console.error(`${place.placeId} ${place.placeName} has suspicious fallback: ${fallback}`);
    }
  }
}

assert(suspiciousCount === 0, `suspicious full romanization count should be 0, got ${suspiciousCount}`);
console.log('Place localization fallback checks passed. Suspicious full romanization: 0');