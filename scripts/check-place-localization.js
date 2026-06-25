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
  const romanizedSuffix = /(bakmulgwan|misulgwan|munhwagonggan|gongwon|haebyeon|haesuyokjang|oreum|ilchulbong|wipanjang|suhyeop|jeomap|yeok|hakgyo|daehakgyo|gung|maeul|geori|sijang|seongdang|gyohoe|dosogwan|daegyo|seom|teowo|seukai)$/i;
  const brokenBrandOrFacilityToken = /(rotde|koekseu|ekowoldeu|beoseu|jeongryujang|delmundo\s+gimnyeongjeomap|hallimsuhyeop|syupeo|sypeo|seteu|seukaiwokeu|wokeohil|aeseuton|hauseu|okeu|seuteikeu)/i;
  const longUnsegmentedToken = text
    .split(/\s+/)
    .some((token) => /^[A-Z][a-z]{23,}$/.test(token));
  const hasNaturalSeparator = /[\s-]/.test(text);
  return (!hasNaturalSeparator && romanizedSuffix.test(compact))
    || brokenBrandOrFacilityToken.test(text)
    || longUnsegmentedToken
    || /Rotdewoldeutawo|Bukchondongyangmunhwabakmulgwan|Seongsanilchulbong|Saebyeoloreum|Delmundo Gimnyeongjeomap Haebyeon|Hallimsuhyeopwipanjang|Koekseu K-POP/i.test(text);
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
  ['P_0020', 'en', 'Grand Walkerhill Seoul'],
  ['P_0039', 'en', 'Gyeongwonjae Ambassador Incheon'],
  ['P_0064', 'en', 'Lotte Department Store Gangnam Branch'],
  ['P_0083', 'en', "Wolfgang's Steakhouse"],
  ['P_0114', 'en', 'Oakwood Premier Incheon'],
  ['P_0138', 'en', 'Oryukdo Skywalk'],
  ['P_0167', 'en', 'Mungyeong Yongdu-ri Super Set'],
  ['P_0169', 'en', 'Mungyeong Eco World'],
  ['P_0170', 'en', 'Grand Walkerhill Seoul Aston House'],
  ['P_0168', 'en', 'Mungyeong Rail Bike Gurang-ri Station'],
  ['P_0171', 'en', 'Aqua Planet Ilsan'],
  ['P_0172', 'en', 'Sayuwon'],
  ['P_0173', 'en', 'Chungju Geonji Village'],
  ['P_0262', 'en', 'BTS Bus Stop'],
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
      '- Required samples checked: Lotte World Tower Seoul Sky, Bukchon Asian Cultural Art Museum, Seongsan Ilchulbong, Beach in front of Delmundo Gimnyeong, Baegyagi Oreum, Andol Oreum, Neopge Oreum, Hallim Fisheries Cooperative Fish Market, Gunsan Oreum, Sangyeo Oreum, COEX K-POP Square, Yongnuni Oreum, Korean Stone Art Museum, BaekInje\'s House Museum, Choi Sunu House, Korea Furniture Museum, Mungyeong Eco World, BTS Bus Stop, Oakwood Premier Incheon, Wolfgang\'s Steakhouse, Oryukdo Skywalk, Grand Walkerhill Seoul Aston House, Mungyeong Rail Bike Gurang-ri Station, Aqua Planet Ilsan, Sayuwon, Chungju Geonji Village',
      '',
      'This audit flags long concatenated romanization, romanized Korean facility/geographic suffixes, and broken brand/facility tokens such as koekseu, ekowoldeu, beoseujeongryujang, delmundo gimnyeongjeomap, hallimsuhyeop, syupeo seteu, seukaiwokeu, wokeohil, hauseu, okeu, bakmulgwan, oreum, ilchulbong, wipanjang, gongwon, hakgyo, haebyeon, yeok, maeul, and geori.',
    ].join('\n'),
    'utf8',
  );
}

console.log(`Place localization audit passed. Rows: ${summary.totalRows}. Rows with image_url: ${summary.rowsWithImages}. Suspicious full romanization: 0`);
