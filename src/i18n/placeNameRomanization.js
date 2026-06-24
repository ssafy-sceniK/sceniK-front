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
  ['양재시민의숲역', { en: "Yangjae Citizen's Forest Station", ja: '良才市民の森駅', 'zh-CN': '良才市民之林站' }],
  ['경복궁', { en: 'Gyeongbokgung Palace', ja: '景福宮', 'zh-CN': '景福宫' }],
  ['화성행궁', { en: 'Hwaseong Haenggung Palace', ja: '華城行宮', 'zh-CN': '华城行宫' }],
  ['운현궁 양관', { en: 'Unhyeongung Yanggwan', ja: '雲峴宮洋館', 'zh-CN': '云岘宫洋馆' }],
  ['롯데월드', { en: 'Lotte World', ja: 'ロッテワールド', 'zh-CN': '乐天世界' }],
  ['수연산방', { en: 'Suyeonsanbang', ja: 'スヨンサンバン', 'zh-CN': '寿砚山房' }],
  ['우리옛돌박물관', { en: 'Korean Stone Art Museum', ja: '韓国石造美術館', 'zh-CN': '韩国石造艺术博物馆' }],
  ['서울역사박물관', { en: 'Seoul Museum of History', ja: 'ソウル歴史博物館', 'zh-CN': '首尔历史博物馆' }],
  ['제주돌문화공원', { en: 'Jeju Stone Park', ja: '済州石文化公園', 'zh-CN': '济州石文化公园' }],
  ['해녀박물관', { en: 'Haenyeo Museum', ja: '海女博物館', 'zh-CN': '海女博物馆' }],
  ['국립아시아문화전당', { en: 'Asia Culture Center', ja: '国立アジア文化殿堂', 'zh-CN': '国立亚洲文化殿堂' }],
  ['인천아트플랫폼', { en: 'Incheon Art Platform', ja: '仁川アートプラットフォーム', 'zh-CN': '仁川艺术平台' }],
  ['국제시장', { en: 'Gukje Market', ja: '国際市場', 'zh-CN': '国际市场' }],
  ['자유공원', { en: 'Jayu Park', ja: '自由公園', 'zh-CN': '自由公园' }],
  ['북촌한옥마을', { en: 'Bukchon Hanok Village', ja: '北村韓屋村', 'zh-CN': '北村韩屋村' }],
  ['전주한옥마을', { en: 'Jeonju Hanok Village', ja: '全州韓屋村', 'zh-CN': '全州韩屋村' }],
  ['감천문화마을', { en: 'Gamcheon Culture Village', ja: '甘川文化村', 'zh-CN': '甘川文化村' }],
  ['이화벽화마을', { en: 'Ihwa Mural Village', ja: '梨花壁画村', 'zh-CN': '梨花壁画村' }],
  ['N서울타워', { en: 'N Seoul Tower', ja: 'Nソウルタワー', 'zh-CN': 'N首尔塔' }],
  ['낙산공원', { en: 'Naksan Park', ja: '駱山公園', 'zh-CN': '骆山公园' }],
  ['도산공원', { en: 'Dosan Park', ja: '島山公園', 'zh-CN': '岛山公园' }],
  ['잠실한강공원', { en: 'Jamsil Hangang Park', ja: '蚕室漢江公園', 'zh-CN': '蚕室汉江公园' }],
  ['서울올림픽주경기장', { en: 'Seoul Olympic Stadium', ja: 'ソウルオリンピック主競技場', 'zh-CN': '首尔奥林匹克主竞技场' }],
  ['롯데월드타워 서울스카이', { en: 'Lotte World Tower Seoul Sky', ja: 'ロッテワールドタワー ソウルスカイ', 'zh-CN': '乐天世界塔首尔天空' }],
  ['명동거리', { en: 'Myeongdong Street', ja: '明洞通り', 'zh-CN': '明洞街' }],
  ['월정리해수욕장', { en: 'Woljeongri Beach', ja: '月汀里海水浴場', 'zh-CN': '月汀里海水浴场' }],
  ['을왕리해수욕장', { en: 'Eulwangni Beach', ja: '乙旺里海水浴場', 'zh-CN': '乙旺里海水浴场' }],
  ['남이섬', { en: 'Nami Island', ja: '南怡島', 'zh-CN': '南怡岛' }],
  ['독도전망대', { en: 'Dokdo Observatory', ja: '独島展望台', 'zh-CN': '独岛展望台' }],
  ['독도', { en: 'Dokdo', ja: '独島', 'zh-CN': '独岛' }],
  ['파라다이스시티', { en: 'Paradise City', ja: 'パラダイスシティ', 'zh-CN': '百乐达斯城' }],
  ['인스파이어 엔터테인먼트 리조트', { en: 'INSPIRE Entertainment Resort', ja: 'インスパイア・エンターテインメント・リゾート', 'zh-CN': 'INSPIRE 娱乐度假村' }],
  ['선운각', { en: 'Seonungak', ja: 'ソヌンガク', 'zh-CN': '仙云阁' }],
  ['봉황각', { en: 'Bonghwanggak', ja: '鳳凰閣', 'zh-CN': '凤凰阁' }],
  ['백인제 가옥', { en: "BaekInje's House Museum", ja: '白麟済家屋', 'zh-CN': '白麟济家屋' }],
  ['북촌동양문화박물관', { en: 'Bukchon Asian Cultural Art Museum', ja: '北村東洋文化博物館', 'zh-CN': '北村东方文化博物馆' }],
  ['최순우 옛집', { en: 'Choi Sunu House', ja: 'チェ・スヌ旧宅', 'zh-CN': '崔淳雨故居' }],
  ['백제문화단지', { en: 'Baekje Cultural Land', ja: '百済文化団地', 'zh-CN': '百济文化园区' }],
  ['경남대학교', { en: 'Kyungnam University', ja: '慶南大学校', 'zh-CN': '庆南大学' }],
  ['BTS 버스정류장', { en: 'BTS Bus Stop', ja: 'BTSバス停', 'zh-CN': 'BTS巴士站' }],
  ['그랜드 워커힐 서울', { en: 'Grand Walkerhill Seoul', ja: 'グランドウォーカーヒルソウル', 'zh-CN': '首尔格兰德华克山庄' }],
  ['경원재 바이 워커힐', { en: 'Gyeongwonjae Ambassador Incheon', ja: '慶源齋アンバサダー仁川', 'zh-CN': '仁川庆源斋大使酒店' }],
  ['롯데백화점 강남점', { en: 'Lotte Department Store Gangnam Branch', ja: 'ロッテ百貨店 江南店', 'zh-CN': '乐天百货江南店' }],
  ['울프강 스테이크 하우스', { en: "Wolfgang's Steakhouse", ja: 'ウルフギャング・ステーキハウス', 'zh-CN': '沃尔夫冈牛排馆' }],
  ['오크우드프리미어 인천', { en: 'Oakwood Premier Incheon', ja: 'オークウッドプレミア仁川', 'zh-CN': '仁川奥克伍德尊贵酒店' }],
  ['오륙도 스카이워크', { en: 'Oryukdo Skywalk', ja: '五六島スカイウォーク', 'zh-CN': '五六岛天空步道' }],
  ['문경 용두리 슈퍼 세트', { en: 'Mungyeong Yongdu-ri Super Set', ja: '聞慶龍頭里スーパーセット', 'zh-CN': '闻庆龙头里超市布景' }],
  ['문경 에코월드', { en: 'Mungyeong Eco World', ja: '聞慶エコワールド', 'zh-CN': '闻庆生态世界' }],
  ['문경 철로자전거 구랑리역', { en: 'Mungyeong Rail Bike Gurang-ri Station', ja: '聞慶鉄道自転車 九郎里駅', 'zh-CN': '闻庆铁路自行车九郎里站' }],
  ['아쿠아플라넷 일산', { en: 'Aqua Planet Ilsan', ja: 'アクアプラネット一山', 'zh-CN': 'Aqua Planet 一山' }],
  ['사유원', { en: 'Sayuwon', ja: 'サユウォン', 'zh-CN': '思惟园' }],
  ['충주 건지마을', { en: 'Chungju Geonji Village', ja: '忠州乾芝村', 'zh-CN': '忠州乾芝村' }],
  ['그랜드 워커힐 서울 애스톤하우스', { en: 'Grand Walkerhill Seoul Aston House', ja: 'グランドウォーカーヒルソウル アストンハウス', 'zh-CN': '首尔格兰德华克山庄 Aston House' }],
  ['하맹방해수욕장', { en: 'Hamaengbang Beach', ja: 'ハメンバン海水浴場', 'zh-CN': '下孟芳海水浴场' }],
  ['고양관광정보센터', { en: 'Goyang Tourist Information Center', ja: '高陽観光情報センター', 'zh-CN': '高阳旅游信息中心' }],
  ['서후리숲', { en: 'Seohuri Forest', ja: 'ソフリの森', 'zh-CN': '西厚里森林' }],
  ['에버랜드 락스빌', { en: 'Everland Rocksville', ja: 'エバーランド・ロックスビル', 'zh-CN': '爱宝乐园 Rocksville' }],
  ['한국가구박물관', { en: 'Korea Furniture Museum', ja: '韓国家具博物館', 'zh-CN': '韩国家具博物馆' }],
  ['아원고택', { en: 'Awon Historic House', ja: 'アウォン古宅', 'zh-CN': '我园古宅' }],
  ['한국의집', { en: 'Korea House', ja: '韓国の家', 'zh-CN': '韩国之家' }],
  ['노들섬', { en: 'Nodeul Island', ja: 'ノドゥル島', 'zh-CN': 'Nodeul岛' }],
  ['송파나루공원 석촌호수', { en: 'Songpa Naru Park Seokchon Lake', ja: '松坡ナル公園 石村湖', 'zh-CN': '松坡渡口公园石村湖' }],
  ['이호테우해변', { en: 'Iho Tewoo Beach', ja: '梨湖テウ海岸', 'zh-CN': '梨湖泰乌海边' }],
  ['스누피가든', { en: 'Snoopy Garden', ja: 'スヌーピーガーデン', 'zh-CN': '史努比庭园' }],
  ['부산시민공원', { en: 'Busan Citizens Park', ja: '釜山市民公園', 'zh-CN': '釜山市民公园' }],
  ['마포진짜원조최대포본점', { en: 'Mapo Jinjja Wonjo Choedaepo Main Branch', ja: '麻浦チンチャ元祖チェデポ本店', 'zh-CN': '麻浦真正元祖崔大炮总店' }],
  ['영진돼지국밥코스트코센텀점', { en: 'Yeongjin Dwaeji Gukbap Costco Centum Branch', ja: 'ヨンジン豚クッパ コストコセンタム店', 'zh-CN': '盈津猪肉汤饭 Costco Centum 店' }],
]);

const SUFFIX_TRANSLATIONS = [
  ['관광정보센터', { en: 'Tourist Information Center', ja: '観光情報センター', 'zh-CN': '旅游信息中心' }],
  ['문화박물관', { en: 'Cultural Museum', ja: '文化博物館', 'zh-CN': '文化博物馆' }],
  ['역사박물관', { en: 'History Museum', ja: '歴史博物館', 'zh-CN': '历史博物馆' }],
  ['미술도서관', { en: 'Art Library', ja: '美術図書館', 'zh-CN': '艺术图书馆' }],
  ['음악도서관', { en: 'Music Library', ja: '音楽図書館', 'zh-CN': '音乐图书馆' }],
  ['해수욕장', { en: 'Beach', ja: '海水浴場', 'zh-CN': '海水浴场' }],
  ['문화공원', { en: 'Culture Park', ja: '文化公園', 'zh-CN': '文化公园' }],
  ['근린공원', { en: 'Neighborhood Park', ja: '近隣公園', 'zh-CN': '社区公园' }],
  ['사적공원', { en: 'Historic Park', ja: '史跡公園', 'zh-CN': '历史公园' }],
  ['벽화터널', { en: 'Mural Tunnel', ja: '壁画トンネル', 'zh-CN': '壁画隧道' }],
  ['벽화마을', { en: 'Mural Village', ja: '壁画村', 'zh-CN': '壁画村' }],
  ['한옥마을', { en: 'Hanok Village', ja: '韓屋村', 'zh-CN': '韩屋村' }],
  ['문화마을', { en: 'Culture Village', ja: '文化村', 'zh-CN': '文化村' }],
  ['전통마을', { en: 'Traditional Village', ja: '伝統村', 'zh-CN': '传统村落' }],
  ['고등학교', { en: 'High School', ja: '高等学校', 'zh-CN': '高中' }],
  ['대학교', { en: 'University', ja: '大学校', 'zh-CN': '大学' }],
  ['직매장', { en: 'Direct Market', ja: '直売所', 'zh-CN': '直营市场' }],
  ['박물관', { en: 'Museum', ja: '博物館', 'zh-CN': '博物馆' }],
  ['미술관', { en: 'Art Museum', ja: '美術館', 'zh-CN': '美术馆' }],
  ['도서관', { en: 'Library', ja: '図書館', 'zh-CN': '图书馆' }],
  ['문화공간', { en: 'Cultural Space', ja: '文化空間', 'zh-CN': '文化空间' }],
  ['아트플랫폼', { en: 'Art Platform', ja: 'アートプラットフォーム', 'zh-CN': '艺术平台' }],
  ['테마파크', { en: 'Theme Park', ja: 'テーマパーク', 'zh-CN': '主题公园' }],
  ['케이블카', { en: 'Cable Car', ja: 'ケーブルカー', 'zh-CN': '缆车' }],
  ['해변', { en: 'Beach', ja: '海岸', 'zh-CN': '海边' }],
  ['공원', { en: 'Park', ja: '公園', 'zh-CN': '公园' }],
  ['시장', { en: 'Market', ja: '市場', 'zh-CN': '市场' }],
  ['거리', { en: 'Street', ja: '通り', 'zh-CN': '街' }],
  ['역', { en: 'Station', ja: '駅', 'zh-CN': '站' }],
  ['학교', { en: 'School', ja: '学校', 'zh-CN': '学校' }],
  ['마을', { en: 'Village', ja: '村', 'zh-CN': '村' }],
  ['옛집', { en: 'Historic House', ja: '旧宅', 'zh-CN': '故居' }],
  ['고택', { en: 'Historic House', ja: '古宅', 'zh-CN': '古宅' }],
  ['가옥', { en: 'House', ja: '家屋', 'zh-CN': '家屋' }],
  ['궁궐', { en: 'Palace', ja: '宮殿', 'zh-CN': '宫殿' }],
  ['궁', { en: 'Palace', ja: '宮', 'zh-CN': '宫' }],
  ['전망대', { en: 'Observatory', ja: '展望台', 'zh-CN': '展望台' }],
  ['대교', { en: 'Bridge', ja: '大橋', 'zh-CN': '大桥' }],
  ['다리', { en: 'Bridge', ja: '橋', 'zh-CN': '桥' }],
  ['교', { en: 'Bridge', ja: '橋', 'zh-CN': '桥' }],
  ['터미널', { en: 'Terminal', ja: 'ターミナル', 'zh-CN': '航站楼' }],
  ['광장', { en: 'Plaza', ja: '広場', 'zh-CN': '广场' }],
  ['리조트', { en: 'Resort', ja: 'リゾート', 'zh-CN': '度假村' }],
  ['호텔', { en: 'Hotel', ja: 'ホテル', 'zh-CN': '酒店' }],
  ['센터', { en: 'Center', ja: 'センター', 'zh-CN': '中心' }],
  ['본점', { en: 'Main Branch', ja: '本店', 'zh-CN': '总店' }],
  ['지점', { en: 'Branch', ja: '支店', 'zh-CN': '分店' }],
  ['항', { en: 'Port', ja: '港', 'zh-CN': '港' }],
  ['섬', { en: 'Island', ja: '島', 'zh-CN': '岛' }],
  ['산', { en: 'Mountain', ja: '山', 'zh-CN': '山' }],
];

const ROOT_TRANSLATIONS = [
  ['양재시민의숲', { en: "Yangjae Citizen's Forest", ja: '良才市民の森', 'zh-CN': '良才市民之林' }],
  ['신촌그래피티', { en: 'Sinchon Graffiti', ja: '新村グラフィティ', 'zh-CN': '新村涂鸦' }],
  ['경복', { en: 'Gyeongbokgung', ja: '景福宮', 'zh-CN': '景福宫' }],
  ['화성', { en: 'Hwaseong', ja: '華城', 'zh-CN': '华城' }],
  ['운현궁 양', { en: 'Unhyeongung Yang', ja: '雲峴宮洋', 'zh-CN': '云岘宫洋' }],
  ['롯데월드타워 서울스카이', { en: 'Lotte World Tower Seoul Sky', ja: 'ロッテワールドタワー ソウルスカイ', 'zh-CN': '乐天世界塔首尔天空' }],
  ['고양관광정보', { en: 'Goyang Tourist Information', ja: '高陽観光情報', 'zh-CN': '高阳旅游信息' }],
  ['서울올림픽주', { en: 'Seoul Olympic Stadium', ja: 'ソウルオリンピック主競技場', 'zh-CN': '首尔奥林匹克主竞技场' }],
  ['부산시민', { en: 'Busan Citizens', ja: '釜山市民', 'zh-CN': '釜山市民' }],
  ['청풍호반', { en: 'Cheongpung Lakeside', ja: '清風湖畔', 'zh-CN': '清风湖畔' }],
  ['철로자전거', { en: 'Rail Bike', ja: 'レールバイク', 'zh-CN': '铁路自行车' }],
  ['고래문화', { en: 'Whale Culture', ja: 'クジラ文化', 'zh-CN': '鲸鱼文化' }],
  ['한탄강', { en: 'Hantangang', ja: '漢灘江', 'zh-CN': '汉滩江' }],
  ['아쿠아플라넷', { en: 'Aqua Planet', ja: 'アクアプラネット', 'zh-CN': 'Aqua Planet' }],
  ['서울역사', { en: 'Seoul History', ja: 'ソウル歴史', 'zh-CN': '首尔历史' }],
  ['국립아시아문화', { en: 'Asia Culture', ja: '国立アジア文化', 'zh-CN': '国立亚洲文化' }],
  ['한국가구', { en: 'Korea Furniture', ja: '韓国家具', 'zh-CN': '韩国家具' }],
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
  ['미술', { en: 'Art', ja: '美術', 'zh-CN': '艺术' }],
  ['음악', { en: 'Music', ja: '音楽', 'zh-CN': '音乐' }],
  ['역사', { en: 'History', ja: '歴史', 'zh-CN': '历史' }],
  ['시립', { en: 'Municipal', ja: '市立', 'zh-CN': '市立' }],
  ['장욱진', { en: 'Jang Ucchin', ja: '張旭鎮', 'zh-CN': '张旭镇' }],
  ['오이도', { en: 'Oido', ja: '烏耳島', 'zh-CN': '乌耳岛' }],
  ['백운', { en: 'Baegun', ja: '白雲', 'zh-CN': '白云' }],
  ['영진', { en: 'Yeongjin', ja: 'ヨンジン', 'zh-CN': '领津' }],
  ['송현', { en: 'Songhyeon', ja: '松峴', 'zh-CN': '松岘' }],
  ['사방기념', { en: 'Sabang Memorial', ja: '砂防記念', 'zh-CN': '砂防纪念' }],
  ['행궁동', { en: 'Haenggung-dong', ja: '行宮洞', 'zh-CN': '行宫洞' }],
  ['고인돌', { en: 'Dolmen', ja: '支石墓', 'zh-CN': '支石墓' }],
  ['오산', { en: 'Osan', ja: '烏山', 'zh-CN': '乌山' }],
  ['중앙탑', { en: 'Jungangtap', ja: '中央塔', 'zh-CN': '中央塔' }],
  ['하조대', { en: 'Hajodae', ja: '河趙台', 'zh-CN': '河赵台' }],
  ['마비정', { en: 'Mabijeong', ja: '馬飛亭', 'zh-CN': '马飞亭' }],
  ['장생포', { en: 'Jangsaengpo', ja: '長生浦', 'zh-CN': '长生浦' }],
  ['의림지', { en: 'Uirimji', ja: '義林池', 'zh-CN': '义林池' }],
  ['구랑리', { en: 'Gurang-ri', ja: '九郎里', 'zh-CN': '九郎里' }],
  ['광치기', { en: 'Gwangchigi', ja: 'クァンチギ', 'zh-CN': 'Gwangchigi' }],
  ['김녕', { en: 'Gimnyeong', ja: '金寧', 'zh-CN': '金宁' }],
  ['북촌', { en: 'Bukchon', ja: '北村', 'zh-CN': '北村' }],
  ['잠실', { en: 'Jamsil', ja: '蚕室', 'zh-CN': '蚕室' }],
  ['부남', { en: 'Bunam', ja: 'ブナム', 'zh-CN': 'Bunam' }],
  ['마검포', { en: 'Mageompo', ja: 'マゴムポ', 'zh-CN': 'Mageompo' }],
  ['하맹방', { en: 'Hamaengbang', ja: 'ハメンバン', 'zh-CN': '下孟芳' }],
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

function localizeUnknownKoreanChunk(chunk, locale) {
  if (locale === 'en') return titleCaseRomanized(romanizeRawKorean(chunk));
  return chunk;
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
      parts.push(localizeUnknownKoreanChunk(chunk, targetLocale));
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
  const directKey = String(source ?? '').trim();
  const override = PLACE_NAME_OVERRIDES.get(directKey) ?? PLACE_NAME_OVERRIDES.get(compact);
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
  if (targetLocale === 'en') return romanizeKoreanPlaceName(source) || source;
  return localizedHybridPlaceName(source, targetLocale) || source;
}
