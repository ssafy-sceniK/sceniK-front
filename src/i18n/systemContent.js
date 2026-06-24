import { getCurrentLocale } from './index.js';

const CATEGORY_KEYS = new Map([
  ['드라마', 'drama'], ['Drama', 'drama'], ['ドラマ', 'drama'], ['电视剧', 'drama'],
  ['영화', 'movie'], ['Movie', 'movie'], ['Film', 'movie'], ['映画', 'movie'], ['电影', 'movie'],
  ['예능', 'variety'], ['Variety', 'variety'], ['Variety show', 'variety'], ['バラエティ', 'variety'], ['综艺', 'variety'],
  ['아이돌', 'idol'], ['Idol', 'idol'], ['アイドル', 'idol'], ['偶像', 'idol'],
  ['배우', 'actor'], ['Actor', 'actor'], ['俳優', 'actor'], ['演员', 'actor'],
  ['촬영지', 'filmingLocation'], ['Filming location', 'filmingLocation'], ['ロケ地', 'filmingLocation'], ['拍摄地', 'filmingLocation'],
  ['카페', 'cafe'], ['Cafe', 'cafe'], ['カフェ', 'cafe'], ['咖啡馆', 'cafe'],
  ['맛집', 'restaurant'], ['Restaurant', 'restaurant'], ['グルメ', 'restaurant'], ['美食', 'restaurant'],
  ['공원', 'park'], ['Park', 'park'], ['公園', 'park'], ['公园', 'park'],
  ['거리', 'street'], ['Street', 'street'], ['通り', 'street'], ['街道', 'street'],
  ['학교', 'school'], ['School', 'school'], ['学校', 'school'],
  ['호텔', 'hotel'], ['Hotel', 'hotel'], ['ホテル', 'hotel'], ['酒店', 'hotel'],
  ['관광지', 'touristAttraction'], ['Tourist attraction', 'touristAttraction'],
  ['전통마을', 'traditionalVillage'], ['Traditional village', 'traditionalVillage'],
  ['한옥/문화공간', 'hanokCultureSpace'], ['문화공간', 'cultureSpace'], ['Culture space', 'cultureSpace'],
  ['궁궐', 'palace'], ['Palace', 'palace'],
  ['해변', 'beach'], ['Beach', 'beach'],
  ['시장', 'market'], ['Market', 'market'], ['시장/위판장', 'market'],
  ['테마파크', 'themePark'], ['Theme park', 'themePark'],
  ['케이블카', 'cableCar'], ['Cable car', 'cableCar'], ['케이블카/관광지', 'cableCar'],
  ['산', 'mountain'], ['Mountain', 'mountain'],
  ['전망대', 'observatory'], ['Observatory', 'observatory'],
  ['쇼핑센터', 'shoppingCenter'], ['Shopping center', 'shoppingCenter'],
  ['숙박', 'lodging'], ['Lodging', 'lodging'],
  ['골프장', 'golfCourse'], ['Golf course', 'golfCourse'],
  ['공연장', 'performanceHall'], ['Performance hall', 'performanceHall'],
  ['국가 유산', 'heritage'], ['국가유산', 'heritage'], ['Heritage', 'heritage'],
  ['굿즈샵', 'goodsShop'], ['Goods shop', 'goodsShop'],
  ['기념물', 'monument'], ['Monument', 'monument'],
  ['도서관', 'library'], ['Library', 'library'],
  ['미술관', 'artMuseum'], ['Art museum', 'artMuseum'],
  ['갤러리', 'gallery'], ['Gallery', 'gallery'],
  ['사우나/찜질방', 'sauna'], ['Sauna', 'sauna'],
  ['서점', 'bookstore'], ['Bookstore', 'bookstore'],
  ['섬', 'island'], ['Island', 'island'],
  ['스튜디오', 'studio'], ['Studio', 'studio'],
  ['역/교통', 'stationTransit'], ['Transit', 'stationTransit'],
  ['유적지', 'historicSite'], ['Historic site', 'historicSite'],
  ['자연명소', 'natureSpot'], ['Nature spot', 'natureSpot'],
  ['절', 'temple'], ['Temple', 'temple'],
  ['카페/가구점', 'cafeFurniture'], ['가구', 'furniture'], ['Furniture', 'furniture'],
]);

const REGION_KEYS = new Map([
  ['서울', 'seoul'], ['Seoul', 'seoul'], ['ソウル', 'seoul'], ['首尔', 'seoul'],
  ['부산', 'busan'], ['Busan', 'busan'], ['釜山', 'busan'],
  ['인천', 'incheon'], ['Incheon', 'incheon'], ['仁川', 'incheon'],
  ['경기', 'gyeonggi'], ['Gyeonggi', 'gyeonggi'], ['京畿', 'gyeonggi'],
  ['강원', 'gangwon'], ['Gangwon', 'gangwon'], ['江原', 'gangwon'],
  ['제주', 'jeju'], ['Jeju', 'jeju'], ['済州', 'jeju'], ['济州', 'jeju'],
  ['충남', 'chungnam'], ['Chungnam', 'chungnam'], ['忠南', 'chungnam'],
  ['충북', 'chungbuk'], ['Chungbuk', 'chungbuk'], ['忠北', 'chungbuk'],
  ['경북', 'gyeongbuk'], ['Gyeongbuk', 'gyeongbuk'], ['慶北', 'gyeongbuk'], ['庆北', 'gyeongbuk'],
  ['경남', 'gyeongnam'], ['Gyeongnam', 'gyeongnam'], ['慶南', 'gyeongnam'], ['庆南', 'gyeongnam'],
  ['전북', 'jeonbuk'], ['Jeonbuk', 'jeonbuk'], ['全北', 'jeonbuk'],
  ['전남', 'jeonnam'], ['Jeonnam', 'jeonnam'], ['全南', 'jeonnam'],
  ['대구', 'daegu'], ['Daegu', 'daegu'], ['大邱', 'daegu'],
  ['광주', 'gwangju'], ['Gwangju', 'gwangju'], ['光州', 'gwangju'],
  ['울산', 'ulsan'], ['Ulsan', 'ulsan'], ['蔚山', 'ulsan'],
  ['종로구', 'jongnoGu'], ['성북구', 'seongbukGu'], ['강북구', 'gangbukGu'], ['중구', 'jungGu'], ['성동구', 'seongdongGu'],
  ['강남구', 'gangnamGu'], ['광진구', 'gwangjinGu'], ['도봉구', 'dobongGu'], ['동대문구', 'dongdaemunGu'], ['마포구', 'mapoGu'],
  ['서대문구', 'seodaemunGu'], ['서초구', 'seochoGu'], ['송파구', 'songpaGu'], ['영등포구', 'yeongdeungpoGu'], ['용산구', 'yongsanGu'],
  ['은평구', 'eunpyeongGu'], ['중랑구', 'jungnangGu'], ['금정구', 'geumjeongGu'], ['남구', 'namGu'], ['동구', 'dongGu'], ['미추홀구', 'michuholGu'],
  ['부산진구', 'busanjinGu'], ['북구', 'bukGu'], ['사하구', 'sahaGu'], ['서구', 'seoGu'], ['수영구', 'suyeongGu'], ['연수구', 'yeonsuGu'], ['해운대구', 'haeundaeGu'],
  ['가평군', 'gapyeongGun'], ['강릉시', 'gangneungSi'], ['고양시', 'goyangSi'], ['고창군', 'gochangGun'], ['공주시', 'gongjuSi'], ['과천시', 'gwacheonSi'],
  ['구리시', 'guriSi'], ['군산시', 'gunsanSi'], ['군위군', 'gunwiGun'], ['김포시', 'gimpoSi'], ['김해시', 'gimhaeSi'], ['남해군', 'namhaeGun'],
  ['논산시', 'nonsanSi'], ['달성군', 'dalseongGun'], ['담양군', 'damyangGun'], ['당진시', 'dangjinSi'], ['무주군', 'mujuGun'], ['문경시', 'mungyeongSi'],
  ['보령시', 'boryeongSi'], ['부여군', 'buyeoGun'], ['삼척시', 'samcheokSi'], ['서귀포시', 'seogwipoSi'], ['성남시', 'seongnamSi'], ['속초시', 'sokchoSi'],
  ['수원시', 'suwonSi'], ['순천시', 'suncheonSi'], ['시흥시', 'siheungSi'], ['안동시', 'andongSi'], ['안성시', 'anseongSi'], ['안양시', 'anyangSi'],
  ['양양군', 'yangyangGun'], ['양주시', 'yangjuSi'], ['양평군', 'yangpyeongGun'], ['영월군', 'yeongwolGun'], ['오산시', 'osanSi'], ['옹진군', 'ongjinGun'],
  ['완주군', 'wanjuGun'], ['용인시', 'yonginSi'], ['울릉군', 'ulleungGun'], ['의정부시', 'uijeongbuSi'], ['이천시', 'icheonSi'], ['익산시', 'iksanSi'],
  ['전주시', 'jeonjuSi'], ['정선군', 'jeongseonGun'], ['제주시', 'jejuSi'], ['제천시', 'jecheonSi'], ['창원시', 'changwonSi'], ['청도군', 'cheongdoGun'],
  ['청주시', 'cheongjuSi'], ['춘천시', 'chuncheonSi'], ['충주시', 'chungjuSi'], ['태안군', 'taeanGun'], ['파주시', 'pajuSi'], ['평창군', 'pyeongchangGun'],
  ['평택시', 'pyeongtaekSi'], ['포천시', 'pocheonSi'], ['포항시', 'pohangSi'], ['하동군', 'hadongGun'], ['함안군', 'hamanGun'], ['홍천군', 'hongcheonGun'], ['화성시', 'hwaseongSi'],
]);

const PREFERENCE_THEME_KEYS = new Map([
  ['감성 여행', 'sentimental'], ['Emotional travel', 'sentimental'],
  ['맛집 중심', 'food'], ['Food-focused', 'food'],
  ['촬영지 중심', 'filming'], ['Filming locations', 'filming'], ['Filming locations focused', 'filming'],
  ['숨은 명소', 'hidden'], ['Hidden gems', 'hidden'],
]);

const TAG_KEYS = new Map([
  ['BTS진', 'btsJin'], ['K팝', 'kpop'], ['가상역사', 'alternateHistory'], ['가족', 'family'], ['감성', 'sentimental'], ['강릉', 'gangneung'],
  ['게스트', 'guest'], ['게임', 'game'], ['고산', 'gosan'], ['공진마을', 'gongjinVillage'], ['궁궐', 'palace'], ['글로벌', 'global'],
  ['기안84', 'kian84'], ['단종', 'danjong'], ['덕수궁', 'deoksugung'], ['데이트', 'date'], ['도시액션', 'urbanAction'], ['도쿄', 'tokyo'],
  ['독일', 'germany'], ['레이스', 'race'], ['로맨스', 'romance'], ['Romance', 'romance'], ['멜로', 'melodrama'], ['무속', 'shamanism'],
  ['무인도', 'desertedIsland'], ['문경', 'mungyeong'], ['문경새재', 'mungyeongSaejae'], ['미션', 'mission'], ['미스터리', 'mystery'], ['민박', 'guesthouse'],
  ['바다', 'sea'], ['버라이어티', 'variety'], ['범죄', 'crime'], ['부부', 'couple'], ['부산', 'busan'], ['불륜', 'affair'],
  ['비내섬', 'binaeIsland'], ['사계절', 'fourSeasons'], ['사극', 'periodDrama'], ['사승봉도', 'saseungbongdo'], ['사투리', 'dialect'], ['산', 'mountain'],
  ['서바이벌', 'survival'], ['서울', 'seoul'], ['수사', 'investigation'], ['수원', 'suwon'], ['숙박', 'lodging'], ['숙소', 'lodging'],
  ['순창', 'sunchang'], ['스릴러', 'thriller'], ['스타배우', 'starActor'], ['아이돌', 'idol'], ['애니메이션', 'animation'], ['액티비티', 'activity'],
  ['엄흥도', 'eomHeungdo'], ['여행', 'travel'], ['역사여행', 'historyTravel'], ['연애리얼리티', 'datingReality'], ['영월', 'yeongwol'], ['오컬트', 'occult'],
  ['왕실', 'royalFamily'], ['용인대장금파크', 'yonginDaejanggeumPark'], ['울릉도', 'ulleungdo'], ['웹예능', 'webVariety'], ['유재석', 'yooJaeseok'], ['음악', 'music'],
  ['인천', 'incheon'], ['입헌군주제', 'constitutionalMonarchy'], ['자연', 'nature'], ['장례', 'funeral'], ['장릉', 'jangneung'], ['재벌', 'chaebol'],
  ['전국', 'nationwide'], ['전통', 'tradition'], ['제주', 'jeju'], ['주문진', 'jumunjin'], ['지역문화', 'localCulture'], ['지역테마', 'localTheme'],
  ['지예은', 'jiYeeun'], ['천국도', 'paradiseIsland'], ['청령포', 'cheongnyeongpo'], ['청춘', 'youth'], ['청하', 'cheongha'], ['촬영지데이터보유', 'filmingData'],
  ['충주', 'chungju'], ['카페', 'cafe'], ['카페감성', 'cafeMood'], ['코미디', 'comedy'], ['타임슬립', 'timeSlip'], ['토크', 'talk'],
  ['통역', 'translation'], ['판타지', 'fantasy'], ['포항', 'pohang'], ['풍수', 'fengShui'], ['해녀', 'haenyeo'], ['해외촬영', 'overseasFilming'],
  ['행궁동', 'haenggungDong'], ['현대도시', 'modernCity'], ['형사', 'detective'], ['화성행궁', 'hwaseongHaenggung'], ['화홍문', 'hwahongmun'], ['흥행작', 'boxOfficeHit'], ['힐링', 'healing'],
]);

const CONTENT_TRANSLATIONS = {
  C_DRAMA_001: {
    en: { title: 'Lovely Runner', description: 'A time-slip romance drama in which devoted fan Im Sol returns to 2008 after the death of her favorite artist Ryu Sun-jae and tries to save him.' },
    ja: { title: 'ソンジェ背負って走れ', description: '推しのアーティスト、リュ・ソンジェの死に絶望したファンのイム・ソルが2008年に戻り、彼を救おうとするタイムスリップ・ロマンスドラマ。' },
    'zh-CN': { title: '背着善宰跑', description: '粉丝任率因最爱的艺人柳善宰离世而绝望，回到2008年试图拯救他的时间穿越爱情剧。' },
  },
  C_DRAMA_002: {
    en: { title: 'Queen of Tears', description: 'A romantic comedy drama about chaebol heiress Hong Hae-in and Baek Hyun-woo from Yongdu-ri finding love again while facing a marital crisis.' },
    ja: { title: '涙の女王', description: '財閥3世ホン・ヘインと龍頭里出身のペク・ヒョヌ夫婦が危機の中で再び愛を始めるロマンチックコメディドラマ。' },
    'zh-CN': { title: '泪之女王', description: '财阀三世洪海仁和来自龙头里的白贤宇夫妇在危机中重新开始相爱的浪漫喜剧。' },
  },
  C_DRAMA_003: {
    en: { title: 'When Life Gives You Tangerines', description: 'A human romance drama that follows Ae-sun and Gwan-sik, who grow up in a Jeju seaside village, through the seasons of their lives.' },
    ja: { title: 'おつかれさま', description: '済州の海辺の村で育ったエスンとグァンシクの人生を四季のように描くヒューマンロマンスドラマ。' },
    'zh-CN': { title: '苦尽柑来遇见你', description: '讲述在济州海边村庄长大的爱纯和宽植如四季般展开人生的温情爱情剧。' },
  },
  C_DRAMA_004: {
    en: { title: 'Squid Game', description: 'A thriller drama in which people buried in debt enter a deadly survival game for a massive cash prize.' },
    ja: { title: 'イカゲーム', description: '借金に追われる人々が巨額賞金をかけて命がけのサバイバルゲームに参加するスリラードラマ。' },
    'zh-CN': { title: '鱿鱼游戏', description: '被债务追逼的人们为了巨额奖金参加致命生存游戏的惊悚剧。' },
  },
  C_DRAMA_005: {
    en: { title: 'Goblin', description: 'A fantasy romance drama about an immortal goblin who needs a human bride to end his life and the girl who summons him.' },
    ja: { title: 'トッケビ', description: '不滅の命を終わらせるために人間の花嫁を必要とするトッケビと、彼を呼び出す少女のファンタジーロマンスドラマ。' },
    'zh-CN': { title: '孤单又灿烂的神－鬼怪', description: '需要人类新娘来结束永生的鬼怪，与召唤他的少女之间的奇幻爱情剧。' },
  },
  C_DRAMA_006: {
    en: { title: 'Hometown Cha-Cha-Cha', description: 'A healing romance drama about a dentist who leaves the city and an all-rounder local man building new days in the seaside village of Gongjin.' },
    ja: { title: '海街チャチャチャ', description: '大都市を離れた歯科医と海辺の村の万能青年が、コンジン村で作っていくヒーリングロマンスドラマ。' },
    'zh-CN': { title: '海岸村恰恰恰', description: '离开大城市的牙医和海边村庄的万能青年在公辰村展开的治愈爱情剧。' },
  },
  C_DRAMA_007: {
    en: { title: 'Our Beloved Summer', description: 'A youth romance drama where former lovers reunite in front of the camera after their high-school documentary unexpectedly becomes popular again.' },
    ja: { title: 'その年、私たちは', description: '別れた恋人たちが高校時代のドキュメンタリーの再注目により、再びカメラの前に立つ青春ロマンスドラマ。' },
    'zh-CN': { title: '那年，我们的夏天', description: '分手的恋人因高中时期纪录片意外走红而再次站到镜头前的青春爱情剧。' },
  },
  C_DRAMA_008: {
    en: { title: 'Crash Landing on You', description: 'A secret romance drama between a chaebol heiress who crash-lands in North Korea after a paragliding accident and the officer who protects her.' },
    ja: { title: '愛の不時着', description: 'パラグライダー事故で北朝鮮に不時着した財閥令嬢と、彼女を守る将校の極秘ロマンスドラマ。' },
    'zh-CN': { title: '爱的迫降', description: '因滑翔伞事故迫降朝鲜的财阀继承女，与保护她的军官之间的秘密爱情剧。' },
  },
  C_DRAMA_009: {
    en: { title: 'Can This Love Be Translated?', description: 'A romantic comedy drama about a global top star and a multilingual interpreter finding the language of love while moving between filming locations.' },
    ja: { title: 'この恋、通訳できますか？', description: 'グローバルトップスターと多言語通訳者が撮影現場を行き来しながら、互いの愛の言葉を見つけていくロマンチックコメディドラマ。' },
    'zh-CN': { title: '这段恋爱可以翻译吗？', description: '全球顶级明星和多语言口译员往返拍摄现场，寻找彼此爱情语言的浪漫喜剧。' },
  },
  C_DRAMA_010: {
    en: { title: "The 21st Century Grand Prince's Wife", description: 'A romance drama set in a 21st-century constitutional monarchy Korea, where chaebol commoner Sung Hee-joo and Prince Ian cross the wall of status.' },
    ja: { title: '21世紀の大君夫人', description: '21世紀の立憲君主制の韓国を舞台に、財閥の平民ソン・ヒジュと王の息子イアン大君が身分の壁を越えるロマンスドラマ。' },
    'zh-CN': { title: '21世纪大君夫人', description: '以21世纪立宪君主制韩国为背景，财阀平民成熙珠和王子李安大君跨越身份壁垒的爱情剧。' },
  },
  C_DRAMA_011: {
    en: { title: 'The World of the Married', description: 'A melodrama thriller about a seemingly perfect marriage collapsing through betrayal and suspicion.' },
    ja: { title: '夫婦の世界', description: '完璧だと信じていた夫婦の世界が裏切りと疑念で崩れていく過程を描く愛憎メロスリラードラマ。' },
    'zh-CN': { title: '夫妻的世界', description: '描绘看似完美的夫妻世界因背叛与怀疑而崩塌的情感惊悚剧。' },
  },
  C_DRAMA_012: {
    en: { title: 'Mr. Queen', description: 'A fusion period comedy drama about a modern man’s soul entering the body of Joseon queen Kim So-yong.' },
    ja: { title: '哲仁王后', description: '現代男性の魂が朝鮮王妃キム・ソヨンの体に宿って起きるフュージョン時代劇コメディドラマ。' },
    'zh-CN': { title: '哲仁王后', description: '现代男性的灵魂进入朝鲜中殿金昭容身体后引发的融合古装喜剧。' },
  },
  C_MOVIE_001: {
    en: { title: 'Exhuma', description: 'An occult mystery film in which a geomancer, undertaker, and shamans face strange events and buried truths after relocating a suspicious grave.' },
    ja: { title: '破墓', description: '怪しい墓を改葬した風水師、葬儀師、巫俗人たちが奇妙な事件と埋もれた真実に向き合うオカルトミステリー映画。' },
    'zh-CN': { title: '破墓', description: '风水师、殡葬师和巫师迁移可疑坟墓后，面对离奇事件与被掩埋真相的 occult 悬疑电影。' },
  },
  C_MOVIE_002: {
    en: { title: 'The Roundup: Punishment', description: 'A crime action film where monster detective Ma Seok-do faces an illegal online gambling ring and a villain from a special forces background.' },
    ja: { title: '犯罪都市 PUNISHMENT', description: '怪物刑事マ・ソクトがオンライン違法賭博組織と特殊部隊出身の悪役に立ち向かう犯罪アクション映画。' },
    'zh-CN': { title: '犯罪都市4', description: '怪物刑警马锡道对抗网络非法赌博组织和特种部队出身反派的犯罪动作电影。' },
  },
  C_MOVIE_003: {
    en: { title: 'The King and the Clown', description: 'A historical drama film based on the exile of King Danjong of Joseon and the story around Eom Heung-do.' },
    ja: { title: '王の男', description: '朝鮮端宗の流刑とオム・フンドをめぐる物語を基にした歴史ドラマ映画。' },
    'zh-CN': { title: '王的男人', description: '以朝鲜端宗流放和严兴道相关故事为基础的历史剧情电影。' },
  },
  C_MOVIE_004: {
    en: { title: 'KPop Demon Hunters', description: 'An animated musical fantasy film in which K-pop superstars Rumi, Mira, and Zoey protect fans through their secret identities as demon hunters.' },
    ja: { title: 'KPop Demon Hunters', description: 'K-POPスーパースターのルミ、ミラ、ゾーイが悪魔ハンターという秘密の正体でファンを守るアニメーション・ミュージカル・ファンタジー映画。' },
    'zh-CN': { title: 'KPop Demon Hunters', description: 'K-pop 超级明星 Rumi、Mira 和 Zoey 以恶魔猎人的秘密身份守护粉丝的动画音乐奇幻电影。' },
  },
  C_MOVIE_005: {
    en: { title: 'Decision to Leave', description: 'A detective melodrama film where an investigator looking into a mountain climber’s death feels both suspicion and fascination toward the victim’s mysterious wife.' },
    ja: { title: '別れる決心', description: '登山家の死を捜査する刑事が、死亡者の謎めいた妻に疑いと関心を同時に抱く捜査メロ映画。' },
    'zh-CN': { title: '分手的决心', description: '调查登山者死亡事件的刑警，对死者神秘妻子同时产生怀疑与兴趣的侦查爱情电影。' },
  },
  C_VARIETY_001: {
    en: { title: 'EXchange', description: 'A dating reality show where former couples who broke up for different reasons gather in one space and choose between past and new love.' },
    ja: { title: '乗り換え恋愛', description: 'さまざまな理由で別れたカップルたちが一つの空間に集まり、過ぎた愛と新しい愛を選ぶ恋愛リアリティ番組。' },
    'zh-CN': { title: '换乘恋爱', description: '因不同原因分手的情侣聚集在同一空间，在过去的爱与新的爱之间做出选择的恋爱真人秀。' },
  },
  C_VARIETY_002: {
    en: { title: 'Running Man', description: 'A long-running variety show where cast members and guests complete missions and races across Korea.' },
    ja: { title: 'ランニングマン', description: '出演者とゲストが全国各地でミッションとレースをこなす長寿バラエティ番組。' },
    'zh-CN': { title: 'Running Man', description: '出演者和嘉宾在韩国各地完成任务与比赛的长寿综艺节目。' },
  },
  C_VARIETY_003: {
    en: { title: "Kian's Bizarre B&B", description: 'A travel reality show where Kian84 opens an eccentric guesthouse on Ulleungdo with Jin and Ji Ye-eun as staff.' },
    ja: { title: '奇案の民宿', description: 'キアン84が鬱陵島で奇想天外な民宿を開き、ジンとチ・イェウンがスタッフとして参加する旅行リアリティ番組。' },
    'zh-CN': { title: '奇案84民宿', description: 'Kian84 在郁陵岛开设奇特民宿，Jin 和池艺恩作为员工加入的旅行真人秀。' },
  },
  C_VARIETY_004: {
    en: { title: 'Pinggyego', description: 'A YouTube talk variety show where Yoo Jae-seok meets friends and guests for free-flowing conversations.' },
    ja: { title: 'ピンゲゴ', description: 'ユ・ジェソクが知人やゲストと会い、自由な雰囲気で語り合うYouTubeトークバラエティ。' },
    'zh-CN': { title: 'Pinggyego', description: '刘在石与熟人和嘉宾在轻松氛围中聊天的 YouTube 谈话综艺。' },
  },
  C_VARIETY_005: {
    en: { title: "Single's Inferno", description: 'A dating reality show where attractive singles move between the deserted island Inferno and Paradise dates to find a match.' },
    ja: { title: '脱出おひとり島', description: '魅力的な独身男女が無人島の地獄島とデート場所の天国島を行き来し、カップル成立を目指す恋愛リアリティ番組。' },
    'zh-CN': { title: '单身即地狱', description: '魅力单身男女往返无人岛地狱岛和天堂岛约会地，寻找配对的恋爱真人秀。' },
  },
};

const PLACE_TRANSLATIONS = {
  P_0257: {
    en: { description: "[The 21st Century Grand Prince's Wife] A Seongbuk-dong cultural space preserving the aesthetics of a 1930s hanok." },
    ja: { description: '［21世紀の大君夫人］1930年代の韓屋の美しさが残る城北洞の文化空間。' },
    'zh-CN': { description: '【21世纪大君夫人】保留1930年代韩屋美感的城北洞文化空间。' },
  },
  P_0261: {
    en: { description: '[Can This Love Be Translated?] A Changwon campus known as one of the drama filming locations.' },
    ja: { description: '［この恋、通訳できますか？］昌原のロケ地として知られるキャンパス。' },
    'zh-CN': { description: '【这段恋爱可以翻译吗？】位于昌原、以剧集拍摄地闻名的校园。' },
  },
};

function translateOrFallback(path, fallback, t, locale) {
  void locale;
  if (!path || !t) return fallback;
  const translated = t(path);
  return translated === path ? fallback : translated;
}

function textValue(value) {
  return String(value ?? '').trim();
}

function fieldForLocale(item, baseName, locale) {
  const normalized = locale === 'zh-CN' ? 'ZhCn' : locale.charAt(0).toUpperCase() + locale.slice(1);
  const candidates = [
    item?.[`${baseName}${normalized}`],
    item?.[`${baseName}_${locale}`],
    item?.localized?.[baseName],
    item?.localizedFields?.[baseName],
    item?.translations?.[locale]?.[baseName],
  ];
  return candidates.find((value) => textValue(value));
}

function sourceValue(item, fieldName, originalFieldName) {
  return textValue(item?.[originalFieldName]) || textValue(item?.[fieldName]);
}

function keyForSystemLabel(value, kind) {
  const source = textValue(value);
  if (!source) return '';
  if (kind === 'region') return REGION_KEYS.get(source) ?? '';
  if (kind === 'tag') return TAG_KEYS.get(source) ?? PREFERENCE_THEME_KEYS.get(source) ?? CATEGORY_KEYS.get(source) ?? REGION_KEYS.get(source) ?? '';
  return CATEGORY_KEYS.get(source) ?? '';
}

export function localizeSystemLabel(value, kind, t, locale = getCurrentLocale()) {
  const source = textValue(value);
  if (!source) return source;
  const key = keyForSystemLabel(source, kind);
  if (!key) return source;
  if (kind === 'region') return translateOrFallback(`content.region.${key}`, source, t, locale);
  if (kind === 'tag') return translateOrFallback(`content.tag.${key}`, source, t, locale);
  return translateOrFallback(`content.category.${key}`, source, t, locale);
}

export function localizeSystemTag(value, t, locale = getCurrentLocale()) {
  return localizeSystemLabel(value, 'tag', t, locale);
}

export function localizePreferenceOption(group, value, t, locale = getCurrentLocale()) {
  const source = textValue(value);
  if (!source) return source;
  if (group === 'regions') return localizeSystemLabel(source, 'region', t, locale);
  if (group === 'contentTypes') {
    const key = CATEGORY_KEYS.get(source);
    return translateOrFallback(key ? `preferences.options.contentTypes.${key}` : '', source, t, locale);
  }
  const themeKey = PREFERENCE_THEME_KEYS.get(source);
  return translateOrFallback(themeKey ? `preferences.options.themes.${themeKey}` : '', source, t, locale);
}

export function localizeContent(content, locale = getCurrentLocale(), t) {
  if (!content) return content;
  const translated = locale === 'ko' ? null : CONTENT_TRANSLATIONS[content.contentId]?.[locale];
  const sourceTags = Array.isArray(content.originalTags) && content.originalTags.length ? content.originalTags : (content.tags ?? []);
  const sourceCategory = sourceValue(content, 'category', 'originalCategory');
  const sourceSubcategory = sourceValue(content, 'subcategory', 'originalSubcategory');
  return {
    ...content,
    title: translated?.title ?? fieldForLocale(content, 'title', locale) ?? content.title,
    description: translated?.description ?? fieldForLocale(content, 'description', locale) ?? content.description,
    category: t ? localizeSystemLabel(sourceCategory, 'category', t, locale) : content.category,
    subcategory: t ? localizeSystemTag(sourceSubcategory, t, locale) : content.subcategory,
    castNames: translated?.castNames ?? fieldForLocale(content, 'castNames', locale) ?? content.castNames,
    tags: t ? sourceTags.map((tag) => localizeSystemTag(tag, t, locale)) : (content.tags ?? []),
  };
}

export function localizePlace(place, locale = getCurrentLocale(), t) {
  if (!place) return place;
  const translated = locale === 'ko' ? null : PLACE_TRANSLATIONS[place.placeId]?.[locale];
  const sourceRegion = sourceValue(place, 'region', 'originalRegion');
  const sourceDistrict = sourceValue(place, 'district', 'originalDistrict');
  const sourceCategory = sourceValue(place, 'category', 'originalCategory');
  return {
    ...place,
    name: translated?.name ?? fieldForLocale(place, 'name', locale) ?? place.name,
    placeName: translated?.placeName ?? fieldForLocale(place, 'placeName', locale) ?? place.placeName,
    region: t ? localizeSystemLabel(sourceRegion, 'region', t, locale) : place.region,
    district: t ? localizeSystemLabel(sourceDistrict, 'region', t, locale) : place.district,
    category: t ? localizeSystemLabel(sourceCategory, 'category', t, locale) : place.category,
    description: translated?.description ?? fieldForLocale(place, 'description', locale) ?? place.description,
  };
}

export const systemContentCoverage = {
  localizedContentCount: Object.keys(CONTENT_TRANSLATIONS).length,
  localizedPlaceCount: Object.keys(PLACE_TRANSLATIONS).length,
  localizedCategoryTagCount: CATEGORY_KEYS.size + REGION_KEYS.size + PREFERENCE_THEME_KEYS.size + TAG_KEYS.size,
};