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
  ['성산일출봉', { en: 'Seongsan Ilchulbong', ja: '城山日出峰', 'zh-CN': '城山日出峰' }],
  ['델문도김녕점앞해변', { en: 'Beach in front of Delmundo Gimnyeong', ja: 'デルムンド金寧店前ビーチ', 'zh-CN': 'Delmundo 金宁店前海滩' }],
  ['백약이오름', { en: 'Baegyagi Oreum', ja: 'ペギャギオルム', 'zh-CN': '百药伊岳' }],
  ['안돌오름', { en: 'Andol Oreum', ja: 'アンドルオルム', 'zh-CN': '安突岳' }],
  ['넙게오름', { en: 'Neopge Oreum', ja: 'ノプケオルム', 'zh-CN': '讷盖岳' }],
  ['우보악', { en: 'Uboak', ja: 'ウボアク', 'zh-CN': 'Uboak' }],
  ['한림수협위판장', { en: 'Hallim Fisheries Cooperative Fish Market', ja: '翰林水協魚市場', 'zh-CN': '翰林水协鱼市' }],
  ['군산오름', { en: 'Gunsan Oreum', ja: 'クンサンオルム', 'zh-CN': '军山岳' }],
  ['상여오름', { en: 'Sangyeo Oreum', ja: 'サンヨオルム', 'zh-CN': 'Sangyeo Oreum' }],
  ['용눈이오름', { en: 'Yongnuni Oreum', ja: 'ヨンヌニオルム', 'zh-CN': '龙眼岳' }],
  ['새별오름', { en: 'Saebyeol Oreum', ja: 'セビョルオルム', 'zh-CN': 'Saebyeol Oreum' }],
  ['금오름', { en: 'Geum Oreum', ja: 'クムオルム', 'zh-CN': 'Geum Oreum' }],
  ['코엑스K-POPSquare', { en: 'COEX K-POP Square', ja: 'COEX K-POP広場', 'zh-CN': 'COEX K-POP广场' }],
  ['코엑스K-POP광장', { en: 'COEX K-POP Square', ja: 'COEX K-POP広場', 'zh-CN': 'COEX K-POP广场' }],
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
  ['문경에코월드', { en: 'Mungyeong Eco World', ja: '聞慶エコワールド', 'zh-CN': '闻庆生态世界' }],
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
  // Extended English place-name quality overrides.
  ["킨텍스", { en: "KINTEX", ja: "킨텍스", 'zh-CN': "킨텍스" }],
  ["남산 산책로", { en: "Namsan Walking Trail", ja: "남산 산책로", 'zh-CN': "남산 산책로" }],
  ["선갑도", { en: "Seongapdo Island", ja: "선갑도", 'zh-CN': "선갑도" }],
  ["마이랜드", { en: "My Land", ja: "마이랜드", 'zh-CN': "마이랜드" }],
  ["대관령 삼양라운드힐", { en: "Daegwallyeong Samyang Roundhill", ja: "대관령 삼양라운드힐", 'zh-CN': "대관령 삼양라운드힐" }],
  ["발왕산 관광케이블카", { en: "Balwangsan Cable Car", ja: "발왕산 관광케이블카", 'zh-CN': "발왕산 관광케이블카" }],
  ["월정사 전나무 숲길", { en: "Woljeongsa Fir Forest Trail", ja: "월정사 전나무 숲길", 'zh-CN': "월정사 전나무 숲길" }],
  ["건국대학교", { en: "Konkuk University", ja: "건국대학교", 'zh-CN': "건국대학교" }],
  ["사근용답간인도교", { en: "Sageun-Yongdap Pedestrian Bridge", ja: "사근용답간인도교", 'zh-CN': "사근용답간인도교" }],
  ["자작나무이야기", { en: "Birch Tree Story", ja: "자작나무이야기", 'zh-CN': "자작나무이야기" }],
  ["한미서점", { en: "Hanmi Bookstore", ja: "한미서점", 'zh-CN': "한미서점" }],
  ["드림파크", { en: "Dream Park", ja: "드림파크", 'zh-CN': "드림파크" }],
  ["청라호수공원", { en: "Cheongna Lake Park", ja: "청라호수공원", 'zh-CN': "청라호수공원" }],
  ["넓은들 학원농장 /(구) 보리나라 학원농장", { en: "Neoreundeul Hagwon Farm (formerly Borinara Hagwon Farm)", ja: "넓은들 학원농장 /(구) 보리나라 학원농장", 'zh-CN': "넓은들 학원농장 /(구) 보리나라 학원농장" }],
  ["석병1리방파제", { en: "Seokbyeong 1-ri Breakwater", ja: "석병1리방파제", 'zh-CN': "석병1리방파제" }],
  ["청하5일장", { en: "Cheongha Five-day Market", ja: "청하5일장", 'zh-CN': "청하5일장" }],
  ["더리버", { en: "The River", ja: "더리버", 'zh-CN': "더리버" }],
  ["서울드래곤시티", { en: "Seoul Dragon City", ja: "서울드래곤시티", 'zh-CN': "서울드래곤시티" }],
  ["라비브북스", { en: "Ravie Books", ja: "라비브북스", 'zh-CN': "라비브북스" }],
  ["카페화홍", { en: "Cafe Hwahong", ja: "카페화홍", 'zh-CN': "카페화홍" }],
  ["지동시장 순대타운", { en: "Jidong Market Sundae Town", ja: "지동시장 순대타운", 'zh-CN': "지동시장 순대타운" }],
  ["더콘란샵코리아", { en: "The Conran Shop Korea", ja: "더콘란샵코리아", 'zh-CN': "더콘란샵코리아" }],
  ["생활맥주 연신내점", { en: "Daily Beer Yeonsinnae Branch", ja: "생활맥주 연신내점", 'zh-CN': "생활맥주 연신내점" }],
  ["JCC크리에이티브센터", { en: "JCC Creative Center", ja: "JCC크리에이티브센터", 'zh-CN': "JCC크리에이티브센터" }],
  ["트리플 스트리트", { en: "Triple Street", ja: "트리플 스트리트", 'zh-CN': "트리플 스트리트" }],
  ["온빛자연휴양림", { en: "Onbit Natural Recreation Forest", ja: "온빛자연휴양림", 'zh-CN': "온빛자연휴양림" }],
  ["보령 청보리밭", { en: "Boryeong Green Barley Field", ja: "보령 청보리밭", 'zh-CN': "보령 청보리밭" }],
  ["별마로천문대", { en: "Byeolmaro Observatory", ja: "별마로천문대", 'zh-CN': "별마로천문대" }],
  ["홍삼스파 참숯가마 사우나", { en: "Hongsam Spa Charcoal Kiln Sauna", ja: "홍삼스파 참숯가마 사우나", 'zh-CN': "홍삼스파 참숯가마 사우나" }],
  ["포천한탄강 하늘다리", { en: "Pocheon Hantangang Sky Bridge", ja: "포천한탄강 하늘다리", 'zh-CN': "포천한탄강 하늘다리" }],
  ["코모도호텔 부산", { en: "Commodore Hotel Busan", ja: "코모도호텔 부산", 'zh-CN': "코모도호텔 부산" }],
  ["BBQ 헬리오시티점", { en: "BBQ Heliocity Branch", ja: "BBQ 헬리오시티점", 'zh-CN': "BBQ 헬리오시티점" }],
  ["운산", { en: "Unsan", ja: "운산", 'zh-CN': "운산" }],
  ["신제물포구락부", { en: "Jemulpo Club", ja: "신제물포구락부", 'zh-CN': "신제물포구락부" }],
  ["치유의 숲", { en: "Forest of Healing", ja: "치유의 숲", 'zh-CN': "치유의 숲" }],
  ["청산수목원", { en: "Cheongsan Arboretum", ja: "청산수목원", 'zh-CN': "청산수목원" }],
  ["탄금호 무지개길", { en: "Tangeumho Rainbow Road", ja: "탄금호 무지개길", 'zh-CN': "탄금호 무지개길" }],
  ["대명비발디파크", { en: "Vivaldi Park", ja: "대명비발디파크", 'zh-CN': "대명비발디파크" }],
  ["원당종마목장", { en: "Wondang Stud Farm", ja: "원당종마목장", 'zh-CN': "원당종마목장" }],
  ["벨라시타", { en: "Bellacitta", ja: "벨라시타", 'zh-CN': "벨라시타" }],
  ["아소산 일산본점", { en: "Asosan Ilsan Main Branch", ja: "아소산 일산본점", 'zh-CN': "아소산 일산본점" }],
  ["봄파머스 가든", { en: "Bom Farmers Garden", ja: "봄파머스 가든", 'zh-CN': "봄파머스 가든" }],
  ["카레클린트 분당용인점", { en: "Kare Klint Bundang-Yongin Branch", ja: "카레클린트 분당용인점", 'zh-CN': "카레클린트 분당용인점" }],
  ["지혜의 숲", { en: "Forest of Wisdom", ja: "지혜의 숲", 'zh-CN': "지혜의 숲" }],
  ["머디머피스", { en: "Muddy Murphy's", ja: "머디머피스", 'zh-CN': "머디머피스" }],
  ["함박웃음순대국", { en: "Hambakuteum Sundae Gukbap", ja: "함박웃음순대국", 'zh-CN': "함박웃음순대국" }],
  ["라망시크레", { en: "L'Amant Secret", ja: "라망시크레", 'zh-CN': "라망시크레" }],
  ["레스케이프 호텔", { en: "L'Escape Hotel", ja: "레스케이프 호텔", 'zh-CN': "레스케이프 호텔" }],
  ["용인 대장금 파크", { en: "Yongin Dae Jang Geum Park", ja: "용인 대장금 파크", 'zh-CN': "용인 대장금 파크" }],
  ["병산서원", { en: "Byeongsan Seowon Confucian Academy", ja: "병산서원", 'zh-CN': "병산서원" }],
  ["오션월드", { en: "Ocean World", ja: "오션월드", 'zh-CN': "오션월드" }],
  ["쁘띠프랑스", { en: "Petite France", ja: "쁘띠프랑스", 'zh-CN': "쁘띠프랑스" }],
  ["더 누룽지", { en: "The Nurungji", ja: "더 누룽지", 'zh-CN': "더 누룽지" }],
  ["김포아트빌리지", { en: "Gimpo Art Village", ja: "김포아트빌리지", 'zh-CN': "김포아트빌리지" }],
  ["시흥 오이도 선사유적공원", { en: "Siheung Oido Prehistoric Park", ja: "시흥 오이도 선사유적공원", 'zh-CN': "시흥 오이도 선사유적공원" }],
  ["등대횟집", { en: "Lighthouse Sashimi Restaurant", ja: "등대횟집", 'zh-CN': "등대횟집" }],
  ["청춘조개본점", { en: "Cheongchun Jogae Main Branch", ja: "청춘조개본점", 'zh-CN': "청춘조개본점" }],
  ["명가돈까스", { en: "Myeongga Donkatsu", ja: "명가돈까스", 'zh-CN': "명가돈까스" }],
  ["시몬스 테라스점", { en: "Simmons Terrace", ja: "시몬스 테라스점", 'zh-CN': "시몬스 테라스점" }],
  ["물빛하늘정원 본점", { en: "Mulbit Haneul Garden Main Branch", ja: "물빛하늘정원 본점", 'zh-CN': "물빛하늘정원 본점" }],
  ["퍼스트가든", { en: "First Garden", ja: "퍼스트가든", 'zh-CN': "퍼스트가든" }],
  ["스피드파크", { en: "Speed Park", ja: "스피드파크", 'zh-CN': "스피드파크" }],
  ["웃다리문화촌", { en: "Utdari Culture Village", ja: "웃다리문화촌", 'zh-CN': "웃다리문화촌" }],
  ["평강랜드", { en: "Pyeonggang Land", ja: "평강랜드", 'zh-CN': "평강랜드" }],
  ["코리아 짚와이어", { en: "Korea Zipwire", ja: "코리아 짚와이어", 'zh-CN': "코리아 짚와이어" }],
  ["영진돼지국밥코스트코센텀점", { en: "Yeongjin Dwaeji Gukbap Costco Centum Branch", ja: "영진돼지국밥코스트코센텀점", 'zh-CN': "영진돼지국밥코스트코센텀점" }],
  ["원조밀면", { en: "Wonjo Milmyeon", ja: "원조밀면", 'zh-CN': "원조밀면" }],
  ["새아침식당", { en: "Saeachim Restaurant", ja: "새아침식당", 'zh-CN': "새아침식당" }],
  ["알베르", { en: "Alver", ja: "알베르", 'zh-CN': "알베르" }],
  ["봉밀가 강남구청점", { en: "Bongmilga Gangnam-gu Office Branch", ja: "봉밀가 강남구청점", 'zh-CN': "봉밀가 강남구청점" }],
  ["늘푸른목장 상암점", { en: "Neulpureun Mokjang Sangam Branch", ja: "늘푸른목장 상암점", 'zh-CN': "늘푸른목장 상암점" }],
  ["문화비축기지", { en: "Oil Tank Culture Park", ja: "문화비축기지", 'zh-CN': "문화비축기지" }],
  ["시골집청국장", { en: "Sigoljip Cheonggukjang", ja: "시골집청국장", 'zh-CN': "시골집청국장" }],
  ["핏제리아오", { en: "Pizzeria O", ja: "핏제리아오", 'zh-CN': "핏제리아오" }],
  ["용마랜드", { en: "Yongma Land", ja: "용마랜드", 'zh-CN': "용마랜드" }],
  ["장생포 고래문화마을", { en: "Jangsaengpo Whale Culture Village", ja: "장생포 고래문화마을", 'zh-CN': "장생포 고래문화마을" }],
  ["삼목선착장", { en: "Sammok Ferry Terminal", ja: "삼목선착장", 'zh-CN': "삼목선착장" }],
  ["문차이나", { en: "Moon China", ja: "문차이나", 'zh-CN': "문차이나" }],
  ["공산성", { en: "Gongsanseong Fortress", ja: "공산성", 'zh-CN': "공산성" }],
  ["명암보트장", { en: "Myeongam Boat Dock", ja: "명암보트장", 'zh-CN': "명암보트장" }],
  ["행궁동 왕의 골목", { en: "Haenggung-dong King's Alley", ja: "행궁동 왕의 골목", 'zh-CN': "행궁동 왕의 골목" }],
  ["금능포구", { en: "Geumneung Port", ja: "금능포구", 'zh-CN': "금능포구" }],
  ["덕천리 드라이브 코스", { en: "Deokcheon-ri Drive Course", ja: "덕천리 드라이브 코스", 'zh-CN': "덕천리 드라이브 코스" }],
  ["영락리 해안도로", { en: "Yeongnak-ri Coastal Road", ja: "영락리 해안도로", 'zh-CN': "영락리 해안도로" }],
  ["종달 마을길", { en: "Jongdal Village Road", ja: "종달 마을길", 'zh-CN': "종달 마을길" }],
  ["중문면세점", { en: "Jungmun Duty Free Shop", ja: "중문면세점", 'zh-CN': "중문면세점" }],
  ["서귀포칼호텔", { en: "Seogwipo KAL Hotel", ja: "서귀포칼호텔", 'zh-CN': "서귀포칼호텔" }],
  ["오라동메밀밭", { en: "Ora-dong Buckwheat Field", ja: "오라동메밀밭", 'zh-CN': "오라동메밀밭" }],
  ["대문바위", { en: "Daemunbawi Rock", ja: "대문바위", 'zh-CN': "대문바위" }],
  ["향로봉", { en: "Hyangrobong Peak", ja: "향로봉", 'zh-CN': "향로봉" }],
  ["경상리 느티나무", { en: "Gyeongsang-ri Zelkova Tree", ja: "경상리 느티나무", 'zh-CN': "경상리 느티나무" }],
  ["창신동 골목", { en: "Changsin-dong Alley", ja: "창신동 골목", 'zh-CN': "창신동 골목" }],
  ["영월 장릉", { en: "Yeongwol Jangneung Royal Tomb", ja: "영월 장릉", 'zh-CN': "영월 장릉" }],
  ["단종역사관", { en: "Danjong History Museum", ja: "단종역사관", 'zh-CN': "단종역사관" }],
  ["영랑호 범바위", { en: "Yeongnangho Beombawi Rock", ja: "영랑호 범바위", 'zh-CN': "영랑호 범바위" }],
  ["파크하얏트 부산", { en: "Park Hyatt Busan", ja: "파크하얏트 부산", 'zh-CN': "파크하얏트 부산" }],
  ["틴더타운", { en: "Tindertown", ja: "틴더타운", 'zh-CN': "틴더타운" }],
  ["플로웨이브", { en: "Flowave", ja: "플로웨이브", 'zh-CN': "플로웨이브" }],
  ["동복해녀해산물직매장", { en: "Dongbok Haenyeo Seafood Direct Sales Market", ja: "동복해녀해산물직매장", 'zh-CN': "동복해녀해산물직매장" }],
  ["코스모스 울릉도", { en: "Healing Stay KOSMOS", ja: "코스모스 울릉도", 'zh-CN': "코스모스 울릉도" }],
  ["태하향목 모노레일", { en: "Taeha Hyangmok Monorail", ja: "태하향목 모노레일", 'zh-CN': "태하향목 모노레일" }],
  ["커피기업 압구정점", { en: "Coffee Gieop Apgujeong Branch", ja: "커피기업 압구정점", 'zh-CN': "커피기업 압구정점" }],
  ["천장지구 카페", { en: "Cheonjangjigu Cafe", ja: "천장지구 카페", 'zh-CN': "천장지구 카페" }],
  ["미미미가든카페", { en: "MIMIMI Garden Cafe", ja: "미미미가든카페", 'zh-CN': "미미미가든카페" }],
  ["사승봉도", { en: "Saseungbongdo Island", ja: "사승봉도", 'zh-CN': "사승봉도" }],
]);

const SUFFIX_TRANSLATIONS = [
  ['\uCE74\uD398', { en: 'Cafe', ja: '\u30AB\u30D5\u30A7', 'zh-CN': '\u5496\u5561\u9986' }],
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
  ['위판장', { en: 'Fish Market', ja: '魚市場', 'zh-CN': '鱼市' }],
  ['오름', { en: 'Oreum', ja: 'オルム', 'zh-CN': '岳' }],
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

const PREFIX_TRANSLATIONS = [
  ['\uCE74\uD398', { en: 'Cafe', ja: '\u30AB\u30D5\u30A7', 'zh-CN': '\u5496\u5561\u9986' }],
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
  ['성산', { en: 'Seongsan', ja: '城山', 'zh-CN': '城山' }],
  ['일출', { en: 'Ilchul', ja: '日出', 'zh-CN': '日出' }],
  ['델문도', { en: 'Delmundo', ja: 'デルムンド', 'zh-CN': 'Delmundo' }],
  ['한림수협', { en: 'Hallim Fisheries Cooperative', ja: '翰林水協', 'zh-CN': '翰林水协' }],
  ['코엑스', { en: 'COEX', ja: 'COEX', 'zh-CN': 'COEX' }],
  ['에코월드', { en: 'Eco World', ja: 'エコワールド', 'zh-CN': '生态世界' }],
  ['스타필드', { en: 'Starfield', ja: 'スターフィールド', 'zh-CN': '星菲尔德' }],
  ['오크우드', { en: 'Oakwood', ja: 'オークウッド', 'zh-CN': '奥克伍德' }],
  ['신세계', { en: 'Shinsegae', ja: '新世界', 'zh-CN': '新世界' }],
  ['현대', { en: 'Hyundai', ja: '現代', 'zh-CN': '现代' }],
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

  const prefixMatch = PREFIX_TRANSLATIONS.find(([prefix]) => compact.startsWith(prefix) && compact.length > prefix.length);
  if (prefixMatch) {
    const [prefix, translations] = prefixMatch;
    const root = compact.slice(prefix.length);
    return [translations[targetLocale] ?? translations.en, localizeRoot(root, targetLocale)].filter(Boolean).join(' ').trim();
  }

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
