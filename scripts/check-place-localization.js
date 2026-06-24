import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  hasKoreanSyllable,
  isBrokenLocalizedPlaceName,
  placeNameFallbackForLocale,
} from '../src/i18n/placeNameRomanization.js';

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

function readPlacesCsv() {
  const candidates = [
    join('..', 'sceniK-back', 'data', 'seed', 'places.csv'),
    join('..', 'data', 'seed', 'places.csv'),
    join('data', 'seed', 'places.csv'),
  ];
  const path = candidates.find((candidate) => existsSync(candidate));
  assert(path, 'places.csv를 찾을 수 없습니다. 프론트 저장소와 백엔드 저장소가 같은 상위 폴더에 있는지 확인하세요.');

  const lines = readFileSync(path, 'utf8').trim().split(/\r?\n/);
  const header = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const row = parseCsvLine(line);
    return Object.fromEntries(header.map((name, index) => [name, row[index] ?? '']));
  });
}

function hasBrokenPlaceholder(value) {
  const text = String(value ?? '').trim();
  return !text || /\uFFFD|\?{2,}|^\?+$/.test(text);
}

function isSuspiciousFullRomanization(value) {
  const text = String(value ?? '').trim();
  const compact = text.replace(/\s+/g, '');
  const romanizedSuffix = /(bakmulgwan|misulgwan|munhwagonggan|gongwon|haebyeon|haesuyokjang|yeok|hakgyo|daehakgyo|gung|maeul|geori|sijang|seongdang|gyohoe|dosogwan|daegyo|seom|teowo|seukai)$/i;
  const longUnsegmentedToken = text
    .split(/\s+/)
    .some((token) => /^[A-Z][a-z]{23,}$/.test(token));
  return romanizedSuffix.test(compact) || longUnsegmentedToken || /Rotdewoldeutawo|Bukchondongyangmunhwabakmulgwan/i.test(text);
}

function placeById(places, placeId) {
  return places.find((place) => place.place_id === placeId);
}

const places = readPlacesCsv();
const expectedSamples = [
  ['P_0219', 'en', 'Lotte World Tower Seoul Sky'],
  ['P_0219', 'ja', 'ロッテワールドタワー ソウルスカイ'],
  ['P_0219', 'zh-CN', '乐天世界塔首尔天空'],
  ['P_0256', 'en', 'Bukchon Asian Cultural Art Museum'],
  ['P_0256', 'ja', '北村東洋文化博物館'],
  ['P_0256', 'zh-CN', '北村东方文化博物馆'],
  ['P_0150', 'en', 'Korean Stone Art Museum'],
  ['P_0255', 'en', "BaekInje's House Museum"],
  ['P_0257', 'en', 'Choi Sunu House'],
  ['P_0267', 'en', 'Korea Furniture Museum'],
];

for (const [placeId, locale, expected] of expectedSamples) {
  const place = placeById(places, placeId);
  assert(place, `${placeId} 샘플 장소를 찾을 수 없습니다.`);
  const fallback = placeNameFallbackForLocale(place.place_name, locale);
  assert(fallback === expected, `${placeId} ${locale} should be ${expected}, got ${fallback}`);
}

const suspicious = [];
const rowsWithImages = places.filter((place) => String(place.image_url ?? '').trim()).length;
for (const locale of ['en', 'ja', 'zh-CN']) {
  for (const place of places) {
    const fallback = placeNameFallbackForLocale(place.place_name, locale);
    assert(!hasBrokenPlaceholder(fallback), `${locale} ${place.place_id} placeName fallback must not be blank or broken`);
    if (hasKoreanSyllable(place.place_name)) {
      assert(!isBrokenLocalizedPlaceName(fallback), `${locale} ${place.place_id} fallback must be safe for display`);
    }
    if (isSuspiciousFullRomanization(fallback)) {
      suspicious.push({
        placeId: place.place_id,
        koName: place.place_name,
        locale,
        localizedName: fallback,
        reason: 'long concatenated romanization or romanized facility suffix',
      });
    }
  }
}

if (suspicious.length > 0) {
  for (const item of suspicious) {
    console.error(`${item.placeId} ${item.koName} ${item.locale}: ${item.localizedName} (${item.reason})`);
  }
}
assert(suspicious.length === 0, `suspicious full romanization count should be 0, got ${suspicious.length}`);

const summary = {
  totalRows: places.length,
  rowsWithImages,
  suspiciousFullRomanization: suspicious.length,
};

if (process.argv.includes('--report')) {
  const reportPath = join('docs', 'evidence', 'place-name-localization-audit.md');
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(
    reportPath,
    [
      '# Place Name Localization Audit',
      '',
      `- Total CSV rows: ${summary.totalRows}`,
      `- Rows with image_url: ${summary.rowsWithImages}`,
      `- Suspicious full romanization: ${summary.suspiciousFullRomanization}`,
      '- Required samples checked: Lotte World Tower Seoul Sky, Bukchon Asian Cultural Art Museum, Korean Stone Art Museum, BaekInje\'s House Museum, Choi Sunu House, Korea Furniture Museum',
      '',
      'This audit flags long concatenated romanization and romanized Korean facility suffixes such as bakmulgwan, gongwon, gung, hakgyo, haebyeon, yeok, maeul, and geori.',
    ].join('\n'),
    'utf8',
  );
}

console.log(`Place localization audit passed. Rows: ${summary.totalRows}. Rows with image_url: ${summary.rowsWithImages}. Suspicious full romanization: 0`);
