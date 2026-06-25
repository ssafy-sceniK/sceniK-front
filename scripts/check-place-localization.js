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

const providedSuspiciousRomanizations = new Set([
  "Taehahyangmok Monoreil",
  "Koseumoseu Ulreungdo",
  "Geumneungpogu",
  "Deokcheonri Deuraibeu Koseu",
  "Yeongrakri Haeandoro",
  "Jongdal Maeulgil",
  "Jungmunmyeonsejeom",
  "Seogwipokal Hotel",
  "Oradongmemilbat",
  "Haenggungdong Wangui Golmok",
  "Yeongrangho Beombawi",
  "Pakeuhayatteubu Mountain",
  "Tindeotaun",
  "Peulroweibeu",
  "Dongbokhaenyeohaesanmul Direct Market",
  "Rabibeubukseu",
  "Kapehwahong",
  "Jidongsijang Sundaetaun",
  "Deokonransyapkoria",
  "Saenghwalmaekju Yeonsinnaejeom",
  "J C C Keurieitibeu Center",
  "Teuripeul Seuteuriteu",
  "Onbitjayeonhyuyangrim",
  "Boryeong Cheongboribat",
  "Seokbyeong1ribangpaje",
  "Cheongha5iljang",
  "Deoribeo",
  "Seouldeuraegonsiti",
  "Kintekseu",
  "Namsan Sanchaekro",
  "Seongapdo",
  "Mairaendeu",
  "Yongin Daejanggeum Pakeu",
  "Byeongsanseowon",
  "Daemyeongbibaldipakeu",
  "Wondangjongmamokjang",
  "Belrasita",
  "Asosanilsan Main Branch",
  "Bompameoseu Gadeun",
  "Karekeulrinteu Bundangyonginjeom",
  "Jihyeui Sup",
  "Meodimeopiseu",
  "Hambakuteumsundaeguk",
  "Ramangsikeure",
  "Reseukeipeu Hotel",
  "Byeolmarocheonmundae",
  "Hongsamseupa Chamsutgama Sauna",
  "Pocheon Hantangang Haneul Bridge",
  "Komodohotelbu Mountain",
  "BBQ Helriositijeom",
  "Un Mountain",
  "Sinjemulpogurakbu",
  "Chiyuui Sup",
  "Cheongsansumokwon",
  "Tangeumho Mujigaegil",
  "Daegwanryeong Samyangraundeuhil",
  "Balwangsangwangwang Cable Car",
  "Woljeongsa Jeonnamu Supgil",
  "Geonguk University",
  "Sageunyongdapganindo Bridge",
  "Jajaknamuiyagi",
  "Hanmiseojeom",
  "Deurimpakeu",
  "Cheongrahosu Park",
  "Neoleundeul Hakwonnongjang/(Gu)Borinara Hakwonnongjang",
  "Osyeonwoldeu",
  "Ppeuttipeurangseu",
  "Deo Nurungji",
  "Gimpoateubilriji",
  "Siheung Oido Seonsayujeok Park",
  "Deungdaehoetjip",
  "Cheongchunjogae Main Branch",
  "Myeonggadonkkaseu",
  "Simonseu Teraseujeom",
  "Mulbithaneuljeongwon Main Branch",
  "Peoseuteugadeun",
  "Seupideupakeu",
  "Utdarimunhwachon",
  "Pyeonggangraendeu",
  "Koria Jipwaieo",
  "Wonjomilmyeon",
  "Saeachimsikdang",
  "Albereu",
  "Bongmilga Gangnamgucheongjeom",
  "Neulpureunmokjang Sangamjeom",
  "Munhwabichukgiji",
  "Sigoljipcheonggukjang",
  "Pitjeriao",
  "Yongmaraendeu",
  "Jangsaengpo Gorae Culture Village",
  "Sammokseonchakjang",
  "Munchaina",
  "Gongsanseong",
  "Myeongamboteujang",
  "Yeongwol Jangreung",
  "Danjongyeoksagwan",
  "Daemunbawi",
  "Hyangrobong",
  "Gyeongsangri Neutinamu",
  "Changsindong Golmok",
  "Keopigieop Apgujeongjeom",
  "Cheonjangjigu Kape",
  "Mimimigadeunkape",
  "Saseungbongdo",
]);

function isSuspiciousFullRomanization(value) {
  const text = String(value ?? '').trim();
  if (providedSuspiciousRomanizations.has(text)) {
    return true;
  }
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

const extendedEnglishSamples = [
  ["P_0001", 'en', "KINTEX"],
  ["P_0007", 'en', "Namsan Walking Trail"],
  ["P_0008", 'en', "Seongapdo Island"],
  ["P_0009", 'en', "My Land"],
  ["P_0013", 'en', "Daegwallyeong Samyang Roundhill"],
  ["P_0014", 'en', "Balwangsan Cable Car"],
  ["P_0015", 'en', "Woljeongsa Fir Forest Trail"],
  ["P_0019", 'en', "Konkuk University"],
  ["P_0024", 'en', "Sageun-Yongdap Pedestrian Bridge"],
  ["P_0029", 'en', "Birch Tree Story"],
  ["P_0035", 'en', "Hanmi Bookstore"],
  ["P_0037", 'en', "Dream Park"],
  ["P_0038", 'en', "Cheongna Lake Park"],
  ["P_0044", 'en', "Neoreundeul Hagwon Farm (formerly Borinara Hagwon Farm)"],
  ["P_0047", 'en', "Seokbyeong 1-ri Breakwater"],
  ["P_0048", 'en', "Cheongha Five-day Market"],
  ["P_0051", 'en', "The River"],
  ["P_0052", 'en', "Seoul Dragon City"],
  ["P_0053", 'en', "Ravie Books"],
  ["P_0054", 'en', "Cafe Hwahong"],
  ["P_0056", 'en', "Jidong Market Sundae Town"],
  ["P_0063", 'en', "The Conran Shop Korea"],
  ["P_0072", 'en', "Daily Beer Yeonsinnae Branch"],
  ["P_0073", 'en', "JCC Creative Center"],
  ["P_0074", 'en', "Triple Street"],
  ["P_0077", 'en', "Onbit Natural Recreation Forest"],
  ["P_0078", 'en', "Boryeong Green Barley Field"],
  ["P_0079", 'en', "Byeolmaro Observatory"],
  ["P_0080", 'en', "Hongsam Spa Charcoal Kiln Sauna"],
  ["P_0081", 'en', "Pocheon Hantangang Sky Bridge"],
  ["P_0082", 'en', "Commodore Hotel Busan"],
  ["P_0084", 'en', "BBQ Heliocity Branch"],
  ["P_0085", 'en', "Unsan"],
  ["P_0086", 'en', "Jemulpo Club"],
  ["P_0091", 'en', "Forest of Healing"],
  ["P_0092", 'en', "Cheongsan Arboretum"],
  ["P_0095", 'en', "Tangeumho Rainbow Road"],
  ["P_0097", 'en', "Vivaldi Park"],
  ["P_0098", 'en', "Wondang Stud Farm"],
  ["P_0099", 'en', "Bellacitta"],
  ["P_0100", 'en', "Asosan Ilsan Main Branch"],
  ["P_0102", 'en', "Bom Farmers Garden"],
  ["P_0103", 'en', "Kare Klint Bundang-Yongin Branch"],
  ["P_0104", 'en', "Forest of Wisdom"],
  ["P_0105", 'en', "Muddy Murphy's"],
  ["P_0109", 'en', "Hambakuteum Sundae Gukbap"],
  ["P_0110", 'en', "L'Amant Secret"],
  ["P_0111", 'en', "L'Escape Hotel"],
  ["P_0112", 'en', "Yongin Dae Jang Geum Park"],
  ["P_0113", 'en', "Byeongsan Seowon Confucian Academy"],
  ["P_0116", 'en', "Ocean World"],
  ["P_0117", 'en', "Petite France"],
  ["P_0119", 'en', "The Nurungji"],
  ["P_0120", 'en', "Gimpo Art Village"],
  ["P_0121", 'en', "Siheung Oido Prehistoric Park"],
  ["P_0122", 'en', "Lighthouse Sashimi Restaurant"],
  ["P_0123", 'en', "Cheongchun Jogae Main Branch"],
  ["P_0126", 'en', "Myeongga Donkatsu"],
  ["P_0127", 'en', "Simmons Terrace"],
  ["P_0128", 'en', "Mulbit Haneul Garden Main Branch"],
  ["P_0130", 'en', "First Garden"],
  ["P_0131", 'en', "Speed Park"],
  ["P_0132", 'en', "Utdari Culture Village"],
  ["P_0133", 'en', "Pyeonggang Land"],
  ["P_0135", 'en', "Korea Zipwire"],
  ["P_0140", 'en', "Yeongjin Dwaeji Gukbap Costco Centum Branch"],
  ["P_0142", 'en', "Wonjo Milmyeon"],
  ["P_0143", 'en', "Saeachim Restaurant"],
  ["P_0144", 'en', "Alver"],
  ["P_0146", 'en', "Bongmilga Gangnam-gu Office Branch"],
  ["P_0147", 'en', "Neulpureun Mokjang Sangam Branch"],
  ["P_0148", 'en', "Oil Tank Culture Park"],
  ["P_0149", 'en', "Sigoljip Cheonggukjang"],
  ["P_0151", 'en', "Pizzeria O"],
  ["P_0153", 'en', "Yongma Land"],
  ["P_0154", 'en', "Jangsaengpo Whale Culture Village"],
  ["P_0155", 'en', "Sammok Ferry Terminal"],
  ["P_0156", 'en', "Moon China"],
  ["P_0159", 'en', "Gongsanseong Fortress"],
  ["P_0162", 'en', "Myeongam Boat Dock"],
  ["P_0165", 'en', "Haenggung-dong King's Alley"],
  ["P_0190", 'en', "Geumneung Port"],
  ["P_0192", 'en', "Deokcheon-ri Drive Course"],
  ["P_0194", 'en', "Yeongnak-ri Coastal Road"],
  ["P_0196", 'en', "Jongdal Village Road"],
  ["P_0197", 'en', "Jungmun Duty Free Shop"],
  ["P_0198", 'en', "Seogwipo KAL Hotel"],
  ["P_0201", 'en', "Ora-dong Buckwheat Field"],
  ["P_0203", 'en', "Daemunbawi Rock"],
  ["P_0204", 'en', "Hyangrobong Peak"],
  ["P_0205", 'en', "Gyeongsang-ri Zelkova Tree"],
  ["P_0206", 'en', "Changsin-dong Alley"],
  ["P_0208", 'en', "Yeongwol Jangneung Royal Tomb"],
  ["P_0210", 'en', "Danjong History Museum"],
  ["P_0220", 'en', "Yeongnangho Beombawi Rock"],
  ["P_0222", 'en', "Park Hyatt Busan"],
  ["P_0230", 'en', "Tindertown"],
  ["P_0232", 'en', "Flowave"],
  ["P_0234", 'en', "Dongbok Haenyeo Seafood Direct Sales Market"],
  ["P_0239", 'en', "Healing Stay KOSMOS"],
  ["P_0243", 'en', "Taeha Hyangmok Monorail"],
  ["P_0246", 'en', "Coffee Gieop Apgujeong Branch"],
  ["P_0247", 'en', "Cheonjangjigu Cafe"],
  ["P_0248", 'en', "MIMIMI Garden Cafe"],
  ["P_0249", 'en', "Saseungbongdo Island"],
];

expectedSamples.push(...extendedEnglishSamples);

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
      `- Required samples checked: ${expectedSamples.length}`,
      '',
      'This audit flags long concatenated romanization, romanized Korean facility/geographic suffixes, and broken brand/facility tokens such as koekseu, ekowoldeu, beoseujeongryujang, delmundo gimnyeongjeomap, hallimsuhyeop, syupeo seteu, seukaiwokeu, wokeohil, hauseu, okeu, bakmulgwan, oreum, ilchulbong, wipanjang, gongwon, hakgyo, haebyeon, yeok, maeul, and geori.',
    ].join('\n'),
    'utf8',
  );
}

console.log(`Place localization audit passed. Rows: ${summary.totalRows}. Rows with image_url: ${summary.rowsWithImages}. Suspicious full romanization: 0`);
