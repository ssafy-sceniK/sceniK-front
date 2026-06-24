const HANGUL_BASE = 0xac00;
const HANGUL_END = 0xd7a3;
const HANGUL_INITIAL_COUNT = 19;
const HANGUL_MEDIAL_COUNT = 21;
const HANGUL_FINAL_COUNT = 28;
const HANGUL_SYLLABLE_COUNT = HANGUL_INITIAL_COUNT * HANGUL_MEDIAL_COUNT * HANGUL_FINAL_COUNT;

const INITIALS = [
  'g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h',
];

const MEDIALS = [
  'a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i',
];

const FINALS = [
  '', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k', 'm', 'l', 'l', 'l', 'p', 'l', 'm', 'p', 'p', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 't',
];

const PLACE_NAME_OVERRIDES = new Map([
  ['서울랜드', { en: 'Seoul Land', ja: 'ソウルランド', 'zh-CN': '首尔乐园' }],
  ['수연산방', { en: 'Suyeonsanbang', ja: 'スヨンサンバン', 'zh-CN': '寿砚山房' }],
  ['최순우옛집', { en: 'Choi Sunu House', ja: 'チェ・スヌ旧宅', 'zh-CN': '崔淳雨故居' }],
  ['우리옛돌박물관', { en: 'Korean Stone Art Museum', ja: '韓国石造美術博物館', 'zh-CN': '韩国石造艺术博物馆' }],
  ['북촌동양문화박물관', { en: 'Bukchon Asian Cultural Art Museum', ja: '北村東洋文化博物館', 'zh-CN': '北村东方文化博物馆' }],
  ['한국가구박물관', { en: 'Korea Furniture Museum', ja: '韓国家具博物館', 'zh-CN': '韩国家具博物馆' }],
  ['경복궁', { en: 'Gyeongbokgung Palace', ja: '景福宮', 'zh-CN': '景福宫' }],
  ['화성행궁', { en: 'Hwaseong Haenggung Palace', ja: '華城行宮', 'zh-CN': '华城行宫' }],
  ['운현궁양관', { en: 'Unhyeongung Yanggwan', ja: '雲峴宮洋館', 'zh-CN': '云岘宫洋馆' }],
  ['백인제가옥', { en: 'Baek Inje House', ja: 'ペク・インジェ家屋', 'zh-CN': '白麟济家屋' }],
  ['북촌한옥마을', { en: 'Bukchon Hanok Village', ja: '北村韓屋村', 'zh-CN': '北村韩屋村' }],
  ['전주한옥마을', { en: 'Jeonju Hanok Village', ja: '全州韓屋村', 'zh-CN': '全州韩屋村' }],
  ['감천문화마을', { en: 'Gamcheon Culture Village', ja: '甘川文化村', 'zh-CN': '甘川文化村' }],
  ['이화벽화마을', { en: 'Ihwa Mural Village', ja: '梨花壁画村', 'zh-CN': '梨花壁画村' }],
  ['제주돌문화공원', { en: 'Jeju Stone Park', ja: '済州石文化公園', 'zh-CN': '济州石文化公园' }],
  ['서울역사박물관', { en: 'Seoul Museum of History', ja: 'ソウル歴史博物館', 'zh-CN': '首尔历史博物馆' }],
  ['해녀박물관', { en: 'Haenyeo Museum', ja: '海女博物館', 'zh-CN': '海女博物馆' }],
  ['국립아시아문화전당', { en: 'Asia Culture Center', ja: 'アジア文化センター', 'zh-CN': '亚洲文化中心' }],
  ['인천아트플랫폼', { en: 'Incheon Art Platform', ja: '仁川アートプラットフォーム', 'zh-CN': '仁川艺术平台' }],
  ['국제시장', { en: 'Gukje Market', ja: '国際市場', 'zh-CN': '国际市场' }],
  ['자유공원', { en: 'Jayu Park', ja: '自由公園', 'zh-CN': '自由公园' }],
  ['낙산공원', { en: 'Naksan Park', ja: '駱山公園', 'zh-CN': '骆山公园' }],
  ['도산공원', { en: 'Dosan Park', ja: '島山公園', 'zh-CN': '岛山公园' }],
  ['부산시민공원', { en: 'Busan Citizens Park', ja: '釜山市民公園', 'zh-CN': '釜山市民公园' }],
  ['잠실한강공원', { en: 'Jamsil Hangang Park', ja: '蚕室漢江公園', 'zh-CN': '蚕室汉江公园' }],
  ['청라호수공원', { en: 'Cheongna Lake Park', ja: '青羅湖水公園', 'zh-CN': '青罗湖水公园' }],
  ['건국대학교', { en: 'Konkuk University', ja: '建国大学', 'zh-CN': '建国大学' }],
  ['덕성여자대학교', { en: "Duksung Women's University", ja: '徳成女子大学', 'zh-CN': '德成女子大学' }],
  ['전주대학교', { en: 'Jeonju University', ja: '全州大学', 'zh-CN': '全州大学' }],
  ['서울시립대학교', { en: 'University of Seoul', ja: 'ソウル市立大学', 'zh-CN': '首尔市立大学' }],
  ['경남대학교', { en: 'Kyungnam University', ja: '慶南大学', 'zh-CN': '庆南大学' }],
  ['명동거리', { en: 'Myeongdong Street', ja: '明洞通り', 'zh-CN': '明洞街' }],
  ['누웨마루거리', { en: 'Nuwemaru Street', ja: 'ヌウェマル通り', 'zh-CN': 'Nuwemaru街' }],
  ['영진해변', { en: 'Yeongjin Beach', ja: 'ヨンジンビーチ', 'zh-CN': '盈津海边' }],
  ['월정리해수욕장', { en: 'Woljeongri Beach', ja: '月汀里海水浴場', 'zh-CN': '月汀里海水浴场' }],
  ['을왕리해수욕장', { en: 'Eulwangni Beach', ja: '乙旺里海水浴場', 'zh-CN': '乙旺里海水浴场' }],
  ['이호테우해변', { en: 'Iho Tewoo Beach', ja: '梨湖テウビーチ', 'zh-CN': '梨湖泰乌海边' }],
  ['양재시민의숲역', { en: "Yangjae Citizen's Forest Station", ja: '良才市民の森駅', 'zh-CN': '良才市民之林站' }],
  ['세빛섬', { en: 'Some Sevit', ja: 'セビッソム', 'zh-CN': '三光岛' }],
  ['양주시립장욱진미술관', { en: 'Yangju City Jang Ucchin Museum of Art', ja: '楊州市立張旭鎮美術館', 'zh-CN': '杨州市立张旭镇美术馆' }],
  ['의정부미술도서관', { en: 'Uijeongbu Art Library', ja: '議政府美術図書館', 'zh-CN': '议政府美术图书馆' }],
  ['의정부음악도서관', { en: 'Uijeongbu Music Library', ja: '議政府音楽図書館', 'zh-CN': '议政府音乐图书馆' }],
  ['시흥오이도박물관', { en: 'Oido Museum', ja: '烏耳島博物館', 'zh-CN': '乌耳岛博物馆' }],
  ['마산어시장', { en: 'Masan Fish Market', ja: '馬山魚市場', 'zh-CN': '马山鱼市场' }],
  ['남이섬', { en: 'Nami Island', ja: '南怡島', 'zh-CN': '南怡岛' }],
  ['노들섬', { en: 'Nodeul Island', ja: 'ノドゥル島', 'zh-CN': 'Nodeul岛' }],
  ['독도전망대', { en: 'Dokdo Observatory', ja: '独島展望台', 'zh-CN': '独岛展望台' }],
  ['서울올림픽주경기장', { en: 'Seoul Olympic Stadium', ja: 'ソウルオリンピック主競技場', 'zh-CN': '首尔奥林匹克主竞技场' }],
  ['생활맥주연신내점', { en: 'Daily Beer Yeonsinnae Branch', ja: '生活ビール延新内店', 'zh-CN': '生活啤酒延新内店' }],
  ['카레클린트분당용인점', { en: 'Kare Klint Bundang Yongin Branch', ja: 'カレクリント盆唐龍仁店', 'zh-CN': 'Kare Klint 盆唐龙仁店' }],
  ['봉밀가강남구청점', { en: 'Bongmilga Gangnam-gu Office Branch', ja: 'ボンミルガ江南区庁店', 'zh-CN': 'Bongmilga 江南区厅店' }],
  ['인스파이어엔터테인먼트리조트', { en: 'INSPIRE Entertainment Resort', ja: 'インスパイア・エンターテインメント・リゾート', 'zh-CN': '迎仕柏娱乐度假城' }],
]);

const SUFFIX_TRANSLATIONS = [
  ['관광정보센터', { en: 'Tourist Information Center', ja: '観光情報センター', 'zh-CN': '旅游信息中心' }],
  ['문화박물관', { en: 'Cultural Museum', ja: '文化博物館', 'zh-CN': '文化博物馆' }],
  ['역사박물관', { en: 'History Museum', ja: '歴史博物館', 'zh-CN': '历史博物馆' }],
  ['미술도서관', { en: 'Art Library', ja: '美術図書館', 'zh-CN': '美术图书馆' }],
  ['음악도서관', { en: 'Music Library', ja: '音楽図書館', 'zh-CN': '音乐图书馆' }],
  ['해수욕장', { en: 'Beach', ja: '海水浴場', 'zh-CN': '海水浴场' }],
  ['문화공원', { en: 'Culture Park', ja: '文化公園', 'zh-CN': '文化公园' }],
  ['근린공원', { en: 'Neighborhood Park', ja: '近隣公園', 'zh-CN': '近邻公园' }],
  ['사적공원', { en: 'Historic Park', ja: '史跡公園', 'zh-CN': '史迹公园' }],
  ['벽화터널', { en: 'Mural Tunnel', ja: '壁画トンネル', 'zh-CN': '壁画隧道' }],
  ['벽화마을', { en: 'Mural Village', ja: '壁画村', 'zh-CN': '壁画村' }],
  ['한옥마을', { en: 'Hanok Village', ja: '韓屋村', 'zh-CN': '韩屋村' }],
  ['문화마을', { en: 'Culture Village', ja: '文化村', 'zh-CN': '文化村' }],
  ['전통마을', { en: 'Traditional Village', ja: '伝統村', 'zh-CN': '传统村' }],
  ['고등학교', { en: 'High School', ja: '高等学校', 'zh-CN': '高中' }],
  ['대학교', { en: 'University', ja: '大学', 'zh-CN': '大学' }],
  ['직매장', { en: 'Direct Market', ja: '直売場', 'zh-CN': '直销市场' }],
  ['박물관', { en: 'Museum', ja: '博物館', 'zh-CN': '博物馆' }],
  ['미술관', { en: 'Art Museum', ja: '美術館', 'zh-CN': '美术馆' }],
  ['도서관', { en: 'Library', ja: '図書館', 'zh-CN': '图书馆' }],
  ['문화공간', { en: 'Cultural Space', ja: '文化空間', 'zh-CN': '文化空间' }],
  ['아트플랫폼', { en: 'Art Platform', ja: 'アートプラットフォーム', 'zh-CN': '艺术平台' }],
  ['테마파크', { en: 'Theme Park', ja: 'テーマパーク', 'zh-CN': '主题公园' }],
  ['케이블카', { en: 'Cable Car', ja: 'ケーブルカー', 'zh-CN': '缆车' }],
  ['해변', { en: 'Beach', ja: 'ビーチ', 'zh-CN': '海边' }],
  ['공원', { en: 'Park', ja: '公園', 'zh-CN': '公园' }],
  ['시장', { en: 'Market', ja: '市場', 'zh-CN': '市场' }],
  ['거리', { en: 'Street', ja: '通り', 'zh-CN': '街' }],
  ['역', { en: 'Station', ja: '駅', 'zh-CN': '站' }],
  ['학교', { en: 'School', ja: '学校', 'zh-CN': '学校' }],
  ['마을', { en: 'Village', ja: '村', 'zh-CN': '村' }],
  ['옛집', { en: 'Historic House', ja: '旧宅', 'zh-CN': '故居' }],
  ['가옥', { en: 'House', ja: '家屋', 'zh-CN': '家屋' }],
  ['궁궐', { en: 'Palace', ja: '宮殿', 'zh-CN': '宫阙' }],
  ['궁', { en: 'Palace', ja: '宮', 'zh-CN': '宫' }],
  ['전망대', { en: 'Observatory', ja: '展望台', 'zh-CN': '观景台' }],
  ['대교', { en: 'Bridge', ja: '大橋', 'zh-CN': '大桥' }],
  ['다리', { en: 'Bridge', ja: '橋', 'zh-CN': '桥' }],
  ['교', { en: 'Bridge', ja: '橋', 'zh-CN': '桥' }],
  ['터미널', { en: 'Terminal', ja: 'ターミナル', 'zh-CN': '客运站' }],
  ['광장', { en: 'Plaza', ja: '広場', 'zh-CN': '广场' }],
  ['리조트', { en: 'Resort', ja: 'リゾート', 'zh-CN': '度假村' }],
  ['호텔', { en: 'Hotel', ja: 'ホテル', 'zh-CN': '酒店' }],
  ['센터', { en: 'Center', ja: 'センター', 'zh-CN': '中心' }],
  ['본점', { en: 'Main Branch', ja: '本店', 'zh-CN': '总店' }],
  ['점', { en: 'Branch', ja: '店', 'zh-CN': '店' }],
  ['항', { en: 'Port', ja: '港', 'zh-CN': '港' }],
  ['섬', { en: 'Island', ja: '島', 'zh-CN': '岛' }],
];

const ROOT_TRANSLATIONS = [
  ['양재시민의숲', { en: "Yangjae Citizen's Forest", ja: '良才市民の森', 'zh-CN': '良才市民之林' }],
  ['신촌그래피티', { en: 'Sinchon Graffiti', ja: '新村グラフィティ', 'zh-CN': '新村涂鸦' }],
  ['마포진짜원조최대포', { en: 'Mapo Jinjja Wonjo Choedaepo', ja: '麻浦チンチャ元祖チェデポ', 'zh-CN': '麻浦真正元祖崔大炮' }],
  ['영진돼지국밥코스트코센텀', { en: 'Yeongjin Dwaeji Gukbap Costco Centum', ja: 'ヨンジン豚クッパ コストコ センタム', 'zh-CN': '盈津猪肉汤饭 Costco Centum' }],
  ['동복해녀해산물', { en: 'Dongbok Haenyeo Seafood', ja: '東福海女海産物', 'zh-CN': '东福海女海鲜' }],
  ['고양관광정보', { en: 'Goyang Tourist Information', ja: '高陽観光情報', 'zh-CN': '高阳旅游信息' }],
  ['서울올림픽', { en: 'Seoul Olympic', ja: 'ソウルオリンピック', 'zh-CN': '首尔奥林匹克' }],
  ['부산시민', { en: 'Busan Citizens', ja: '釜山市民', 'zh-CN': '釜山市民' }],
  ['청풍호반', { en: 'Cheongpung Lakeside', ja: '清風湖畔', 'zh-CN': '清风湖畔' }],
  ['철로자전거', { en: 'Rail Bike', ja: 'レールバイク', 'zh-CN': '铁路自行车' }],
  ['고래문화', { en: 'Whale Culture', ja: 'クジラ文化', 'zh-CN': '鲸鱼文化' }],
  ['한탄강', { en: 'Hantangang', ja: '漢灘江', 'zh-CN': '汉滩江' }],
  ['아쿠아플라넷', { en: 'Aqua Planet', ja: 'アクアプラネット', 'zh-CN': 'Aqua Planet' }],
  ['서울역사', { en: 'Seoul History', ja: 'ソウル歴史', 'zh-CN': '首尔历史' }],
  ['국립아시아', { en: 'Asia', ja: 'アジア', 'zh-CN': '亚洲' }],
  ['한국', { en: 'Korean', ja: '韓国', 'zh-CN': '韩国' }],
  ['서울', { en: 'Seoul', ja: 'ソウル', 'zh-CN': '首尔' }],
  ['부산', { en: 'Busan', ja: '釜山', 'zh-CN': '釜山' }],
  ['제주', { en: 'Jeju', ja: '済州', 'zh-CN': '济州' }],
  ['전주', { en: 'Jeonju', ja: '全州', 'zh-CN': '全州' }],
  ['경남', { en: 'Kyungnam', ja: '慶南', 'zh-CN': '庆南' }],
  ['고양', { en: 'Goyang', ja: '高陽', 'zh-CN': '高阳' }],
  ['양주', { en: 'Yangju', ja: '楊州', 'zh-CN': '杨州' }],
  ['의정부', { en: 'Uijeongbu', ja: '議政府', 'zh-CN': '议政府' }],
  ['시흥', { en: 'Siheung', ja: '始興', 'zh-CN': '始兴' }],
  ['문경', { en: 'Mungyeong', ja: '聞慶', 'zh-CN': '闻庆' }],
  ['충주', { en: 'Chungju', ja: '忠州', 'zh-CN': '忠州' }],
  ['포천', { en: 'Pocheon', ja: '抱川', 'zh-CN': '抱川' }],
  ['마산', { en: 'Masan', ja: '馬山', 'zh-CN': '马山' }],
  ['한강', { en: 'Hangang', ja: '漢江', 'zh-CN': '汉江' }],
  ['동양', { en: 'Asian', ja: '東洋', 'zh-CN': '东方' }],
  ['문화', { en: 'Culture', ja: '文化', 'zh-CN': '文化' }],
  ['예술', { en: 'Art', ja: '芸術', 'zh-CN': '艺术' }],
  ['미술', { en: 'Art', ja: '美術', 'zh-CN': '美术' }],
  ['음악', { en: 'Music', ja: '音楽', 'zh-CN': '音乐' }],
  ['역사', { en: 'History', ja: '歴史', 'zh-CN': '历史' }],
  ['시립', { en: 'Municipal', ja: '市立', 'zh-CN': '市立' }],
  ['장욱진', { en: 'Jang Ucchin', ja: '張旭鎮', 'zh-CN': '张旭镇' }],
  ['오이도', { en: 'Oido', ja: '烏耳島', 'zh-CN': '乌耳岛' }],
  ['백운', { en: 'Baegun', ja: '白雲', 'zh-CN': '白云' }],
  ['영진', { en: 'Yeongjin', ja: 'ヨンジン', 'zh-CN': '盈津' }],
  ['송현', { en: 'Songhyeon', ja: '松峴', 'zh-CN': '松岘' }],
  ['사방기념', { en: 'Sabang Memorial', ja: '砂防記念', 'zh-CN': '砂防纪念' }],
  ['행궁동', { en: 'Haenggung-dong', ja: '行宮洞', 'zh-CN': '行宫洞' }],
  ['고인돌', { en: 'Dolmen', ja: '支石墓', 'zh-CN': '支石墓' }],
  ['가온', { en: 'Gaon', ja: 'ガオン', 'zh-CN': 'Gaon' }],
  ['오산', { en: 'Osan', ja: '烏山', 'zh-CN': '乌山' }],
  ['중앙탑', { en: 'Jungangtap', ja: '中央塔', 'zh-CN': '中央塔' }],
  ['하조대', { en: 'Hajodae', ja: '河趙台', 'zh-CN': '河赵台' }],
  ['마비정', { en: 'Mabijeong', ja: '馬飛亭', 'zh-CN': '马飞亭' }],
  ['장생포', { en: 'Jangsaengpo', ja: '長生浦', 'zh-CN': '长生浦' }],
  ['의림지', { en: 'Uirimji', ja: '義林池', 'zh-CN': '义林池' }],
  ['구랑리', { en: 'Gurang-ri', ja: '九郎里', 'zh-CN': '九郎里' }],
  ['광치기', { en: 'Gwangchigi', ja: 'クァンチギ', 'zh-CN': 'Gwangchigi' }],
  ['델문도', { en: 'Del Mundo', ja: 'デルムンド', 'zh-CN': 'Del Mundo' }],
  ['김녕', { en: 'Gimnyeong', ja: '金寧', 'zh-CN': '金宁' }],
  ['북촌', { en: 'Bukchon', ja: '北村', 'zh-CN': '北村' }],
  ['잠실', { en: 'Jamsil', ja: '蚕室', 'zh-CN': '蚕室' }],
  ['부남', { en: 'Bunam', ja: 'ブナム', 'zh-CN': 'Bunam' }],
  ['마검포', { en: 'Mageompo', ja: 'マゴムポ', 'zh-CN': 'Mageompo' }],
  ['하맹방', { en: 'Hamaengbang', ja: 'ハメンバン', 'zh-CN': 'Hamaengbang' }],
  ['감천', { en: 'Gamcheon', ja: '甘川', 'zh-CN': '甘川' }],
];

export function hasKoreanSyllable(value) {
  return /[\uac00-\ud7a3]/.test(String(value ?? ''));
}

export function isBrokenLocalizedPlaceName(value) {
  const text = String(value ?? '').trim();
  return !text || /\uFFFD|\?{2,}|^\?+$/.test(text);
}

function normalizedKey(value) {
  return String(value ?? '').replace(/\s+/g, '').trim();
}

function normalizedLocale(locale) {
  if (locale === 'zh') return 'zh-CN';
  return ['ko', 'en', 'ja', 'zh-CN'].includes(locale) ? locale : 'en';
}

function romanizeHangulSyllable(char) {
  const code = char.codePointAt(0);
  if (code < HANGUL_BASE || code > HANGUL_END) return char;
  const offset = code - HANGUL_BASE;
  if (offset < 0 || offset >= HANGUL_SYLLABLE_COUNT) return char;
  const initialIndex = Math.floor(offset / (HANGUL_MEDIAL_COUNT * HANGUL_FINAL_COUNT));
  const medialIndex = Math.floor((offset % (HANGUL_MEDIAL_COUNT * HANGUL_FINAL_COUNT)) / HANGUL_FINAL_COUNT);
  const finalIndex = offset % HANGUL_FINAL_COUNT;
  return `${INITIALS[initialIndex]}${MEDIALS[medialIndex]}${FINALS[finalIndex]}`;
}

function titleCaseRomanized(value) {
  return value
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b[a-z]/g, (match) => match.toUpperCase());
}

function romanizeRawKorean(value) {
  return [...String(value ?? '')]
    .map((char) => {
      if (/[\uac00-\ud7a3]/.test(char)) return romanizeHangulSyllable(char);
      if (/[\u3131-\u318e]/.test(char)) return ' ';
      if (/[\s\-_/().,&+]/.test(char)) return char;
      return char;
    })
    .join('')
    .replace(/\s*([\-_/().,&+])\s*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function localizeRoot(value, locale) {
  const targetLocale = normalizedLocale(locale);
  let rest = String(value ?? '').trim();
  if (!rest) return '';
  const parts = [];

  while (rest) {
    const matched = ROOT_TRANSLATIONS.find(([source]) => rest.startsWith(source));
    if (matched) {
      parts.push(matched[1][targetLocale] ?? matched[1].en);
      rest = rest.slice(matched[0].length).trimStart();
      continue;
    }
    const char = [...rest][0];
    if (/\s/.test(char)) {
      rest = rest.slice(char.length).trimStart();
      continue;
    }
    if (/[\uac00-\ud7a3]/.test(char)) {
      let chunk = char;
      rest = rest.slice(char.length);
      while (rest && /[\uac00-\ud7a3]/.test([...rest][0]) && !ROOT_TRANSLATIONS.some(([source]) => rest.startsWith(source))) {
        const nextChar = [...rest][0];
        chunk += nextChar;
        rest = rest.slice(nextChar.length);
      }
      parts.push(titleCaseRomanized(romanizeRawKorean(chunk)));
      continue;
    }
    parts.push(char);
    rest = rest.slice(char.length);
  }

  return parts.join(' ').replace(/\s+([).,])/g, '$1').replace(/([(])\s+/g, '$1').replace(/\s+/g, ' ').trim();
}

function localizedHybridPlaceName(source, locale) {
  const targetLocale = normalizedLocale(locale);
  const compact = normalizedKey(source);
  const override = PLACE_NAME_OVERRIDES.get(compact);
  if (override?.[targetLocale]) return override[targetLocale];

  const suffixMatch = SUFFIX_TRANSLATIONS.find(([suffix]) => compact.endsWith(suffix) && compact.length > suffix.length);
  if (!suffixMatch) return '';
  const [suffix, translations] = suffixMatch;
  const root = compact.slice(0, -suffix.length);
  return [localizeRoot(root, targetLocale), translations[targetLocale] ?? translations.en].filter(Boolean).join(' ').trim();
}

export function romanizeKoreanPlaceName(value) {
  const source = String(value ?? '').trim();
  if (!source || isBrokenLocalizedPlaceName(source)) return '';
  if (!hasKoreanSyllable(source)) return source;
  return localizedHybridPlaceName(source, 'en') || titleCaseRomanized(romanizeRawKorean(source));
}

export function placeNameFallbackForLocale(value, locale) {
  const source = String(value ?? '').trim();
  if (!source || isBrokenLocalizedPlaceName(source)) return '';
  const targetLocale = normalizedLocale(locale);
  if (targetLocale === 'ko') return source;
  if (!hasKoreanSyllable(source)) return source;
  return localizedHybridPlaceName(source, targetLocale) || romanizeKoreanPlaceName(source) || source;
}