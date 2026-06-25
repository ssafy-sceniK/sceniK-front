function compactKey(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[\s_\-.,/()\u00B7]+/g, '');
}

const REGION_ALIASES = new Map([
  ['\uC11C\uC6B8', '\uC11C\uC6B8'],
  ['\uC11C\uC6B8\uD2B9\uBCC4\uC2DC', '\uC11C\uC6B8'],
  ['seoul', '\uC11C\uC6B8'],
  ['seoulspecialcity', '\uC11C\uC6B8'],
  ['\u30BD\u30A6\u30EB', '\uC11C\uC6B8'],
  ['\u9996\u5C14', '\uC11C\uC6B8'],
  ['\u9996\u723E', '\uC11C\uC6B8'],
  ['\uBD80\uC0B0', '\uBD80\uC0B0'],
  ['\uBD80\uC0B0\uAD11\uC5ED\uC2DC', '\uBD80\uC0B0'],
  ['busan', '\uBD80\uC0B0'],
  ['\u91DC\u5C71', '\uBD80\uC0B0'],
  ['\uC778\uCC9C', '\uC778\uCC9C'],
  ['\uC778\uCC9C\uAD11\uC5ED\uC2DC', '\uC778\uCC9C'],
  ['incheon', '\uC778\uCC9C'],
  ['\u4EC1\u5DDD', '\uC778\uCC9C'],
  ['\uB300\uAD6C', '\uB300\uAD6C'],
  ['\uB300\uAD6C\uAD11\uC5ED\uC2DC', '\uB300\uAD6C'],
  ['daegu', '\uB300\uAD6C'],
  ['\u5927\u90B1', '\uB300\uAD6C'],
  ['\uB300\uC804', '\uB300\uC804'],
  ['\uB300\uC804\uAD11\uC5ED\uC2DC', '\uB300\uC804'],
  ['daejeon', '\uB300\uC804'],
  ['\u5927\u7530', '\uB300\uC804'],
  ['\uAD11\uC8FC', '\uAD11\uC8FC'],
  ['\uAD11\uC8FC\uAD11\uC5ED\uC2DC', '\uAD11\uC8FC'],
  ['gwangju', '\uAD11\uC8FC'],
  ['\u5149\u5DDE', '\uAD11\uC8FC'],
  ['\uC6B8\uC0B0', '\uC6B8\uC0B0'],
  ['\uC6B8\uC0B0\uAD11\uC5ED\uC2DC', '\uC6B8\uC0B0'],
  ['ulsan', '\uC6B8\uC0B0'],
  ['\u851A\u5C71', '\uC6B8\uC0B0'],
  ['\uC138\uC885', '\uC138\uC885'],
  ['\uC138\uC885\uD2B9\uBCC4\uC790\uCE58\uC2DC', '\uC138\uC885'],
  ['sejong', '\uC138\uC885'],
  ['\u4E16\u5B97', '\uC138\uC885'],
  ['\uACBD\uAE30', '\uACBD\uAE30'],
  ['\uACBD\uAE30\uB3C4', '\uACBD\uAE30'],
  ['gyeonggi', '\uACBD\uAE30'],
  ['gyeonggido', '\uACBD\uAE30'],
  ['gyeonggiprovince', '\uACBD\uAE30'],
  ['\u4EAC\u757F', '\uACBD\uAE30'],
  ['\uAC15\uC6D0', '\uAC15\uC6D0'],
  ['\uAC15\uC6D0\uB3C4', '\uAC15\uC6D0'],
  ['\uAC15\uC6D0\uD2B9\uBCC4\uC790\uCE58\uB3C4', '\uAC15\uC6D0'],
  ['gangwon', '\uAC15\uC6D0'],
  ['gangwondo', '\uAC15\uC6D0'],
  ['gangwonprovince', '\uAC15\uC6D0'],
  ['\u6C5F\u539F', '\uAC15\uC6D0'],
  ['\uCDA9\uBD81', '\uCDA9\uBD81'],
  ['\uCDA9\uCCAD\uBD81\uB3C4', '\uCDA9\uBD81'],
  ['chungbuk', '\uCDA9\uBD81'],
  ['chungcheongbuk', '\uCDA9\uBD81'],
  ['northchungcheong', '\uCDA9\uBD81'],
  ['\u5FE0\u5317', '\uCDA9\uBD81'],
  ['\u5FE0\u6E05\u5317\u9053', '\uCDA9\uBD81'],
  ['\uCDA9\uB0A8', '\uCDA9\uB0A8'],
  ['\uCDA9\uCCAD\uB0A8\uB3C4', '\uCDA9\uB0A8'],
  ['chungnam', '\uCDA9\uB0A8'],
  ['chungcheongnam', '\uCDA9\uB0A8'],
  ['southchungcheong', '\uCDA9\uB0A8'],
  ['\u5FE0\u5357', '\uCDA9\uB0A8'],
  ['\u5FE0\u6E05\u5357\u9053', '\uCDA9\uB0A8'],
  ['\uC804\uBD81', '\uC804\uBD81'],
  ['\uC804\uB77C\uBD81\uB3C4', '\uC804\uBD81'],
  ['\uC804\uBD81\uD2B9\uBCC4\uC790\uCE58\uB3C4', '\uC804\uBD81'],
  ['jeonbuk', '\uC804\uBD81'],
  ['jeollabuk', '\uC804\uBD81'],
  ['northjeolla', '\uC804\uBD81'],
  ['\u5168\u5317', '\uC804\uBD81'],
  ['\u5168\u7F57\u5317', '\uC804\uBD81'],
  ['\u5168\u7F85\u5317', '\uC804\uBD81'],
  ['\uC804\uB0A8', '\uC804\uB0A8'],
  ['\uC804\uB77C\uB0A8\uB3C4', '\uC804\uB0A8'],
  ['jeonnam', '\uC804\uB0A8'],
  ['jeollanam', '\uC804\uB0A8'],
  ['southjeolla', '\uC804\uB0A8'],
  ['\u5168\u5357', '\uC804\uB0A8'],
  ['\uACBD\uBD81', '\uACBD\uBD81'],
  ['\uACBD\uC0C1\uBD81\uB3C4', '\uACBD\uBD81'],
  ['gyeongbuk', '\uACBD\uBD81'],
  ['gyeongsangbuk', '\uACBD\uBD81'],
  ['northgyeongsang', '\uACBD\uBD81'],
  ['\u6176\u5317', '\uACBD\uBD81'],
  ['\u5E86\u5317', '\uACBD\uBD81'],
  ['\uACBD\uB0A8', '\uACBD\uB0A8'],
  ['\uACBD\uC0C1\uB0A8\uB3C4', '\uACBD\uB0A8'],
  ['gyeongnam', '\uACBD\uB0A8'],
  ['gyeongsangnam', '\uACBD\uB0A8'],
  ['southgyeongsang', '\uACBD\uB0A8'],
  ['\u6176\u5357', '\uACBD\uB0A8'],
  ['\u5E86\u5357', '\uACBD\uB0A8'],
  ['\uC81C\uC8FC', '\uC81C\uC8FC'],
  ['\uC81C\uC8FC\uD2B9\uBCC4\uC790\uCE58\uB3C4', '\uC81C\uC8FC'],
  ['jeju', '\uC81C\uC8FC'],
  ['jejudo', '\uC81C\uC8FC'],
  ['\u6E08\u5DDE', '\uC81C\uC8FC'],
  ['\u6D4E\u5DDE', '\uC81C\uC8FC'],
  ['\u6FDF\u5DDE', '\uC81C\uC8FC'],
]);

const STYLE_ALIASES = new Map([
  ['\uAC10\uC131\uC5EC\uD589', '\uAC10\uC131 \uC5EC\uD589'],
  ['emotionaltravel', '\uAC10\uC131 \uC5EC\uD589'],
  ['emotionaltrip', '\uAC10\uC131 \uC5EC\uD589'],
  ['sentimental', '\uAC10\uC131 \uC5EC\uD589'],
  ['\u611F\u6027\u65C5\u884C', '\uAC10\uC131 \uC5EC\uD589'],
  ['\u6C1B\u56F4\u65C5\u884C', '\uAC10\uC131 \uC5EC\uD589'],
  ['\uBD84\uC704\uAE30\uC5EC\uD589', '\uAC10\uC131 \uC5EC\uD589'],
  ['\uB9DB\uC9D1\uC911\uC2EC', '\uB9DB\uC9D1 \uC911\uC2EC'],
  ['foodfocused', '\uB9DB\uC9D1 \uC911\uC2EC'],
  ['food', '\uB9DB\uC9D1 \uC911\uC2EC'],
  ['gourmet', '\uB9DB\uC9D1 \uC911\uC2EC'],
  ['\u30B0\u30EB\u30E1\u4E2D\u5FC3', '\uB9DB\uC9D1 \uC911\uC2EC'],
  ['\u7F8E\u98DF\u4E3A\u4E3B', '\uB9DB\uC9D1 \uC911\uC2EC'],
  ['\uCD2C\uC601\uC9C0\uC911\uC2EC', '\uCD2C\uC601\uC9C0 \uC911\uC2EC'],
  ['filminglocationsfocused', '\uCD2C\uC601\uC9C0 \uC911\uC2EC'],
  ['filminglocations', '\uCD2C\uC601\uC9C0 \uC911\uC2EC'],
  ['filming', '\uCD2C\uC601\uC9C0 \uC911\uC2EC'],
  ['\u30ED\u30B1\u5730\u4E2D\u5FC3', '\uCD2C\uC601\uC9C0 \uC911\uC2EC'],
  ['\u53D6\u666F\u5730\u4E3A\u4E3B', '\uCD2C\uC601\uC9C0 \uC911\uC2EC'],
  ['\uC228\uC740\uBA85\uC18C', '\uC228\uC740 \uBA85\uC18C'],
  ['hiddengems', '\uC228\uC740 \uBA85\uC18C'],
  ['hidden', '\uC228\uC740 \uBA85\uC18C'],
  ['\u96A0\u308C\u305F\u540D\u6240', '\uC228\uC740 \uBA85\uC18C'],
  ['\u5C0F\u4F17\u540D\u80DC', '\uC228\uC740 \uBA85\uC18C'],
]);

const COMPANION_ALIASES = new Map([
  ['\uD63C\uC790', '\uD63C\uC790'],
  ['solo', '\uD63C\uC790'],
  ['alone', '\uD63C\uC790'],
  ['\u3072\u3068\u308A', '\uD63C\uC790'],
  ['\u72EC\u81EA', '\uD63C\uC790'],
  ['\uCE5C\uAD6C', '\uCE5C\uAD6C'],
  ['friend', '\uCE5C\uAD6C'],
  ['friends', '\uCE5C\uAD6C'],
  ['\u53CB\u9054', '\uCE5C\uAD6C'],
  ['\u670B\u53CB', '\uCE5C\uAD6C'],
  ['\uC5F0\uC778', '\uC5F0\uC778'],
  ['couple', '\uC5F0\uC778'],
  ['lover', '\uC5F0\uC778'],
  ['\u604B\u4EBA', '\uC5F0\uC778'],
  ['\u60C5\u4FA3', '\uC5F0\uC778'],
  ['\uAC00\uC871', '\uAC00\uC871'],
  ['family', '\uAC00\uC871'],
  ['\u5BB6\u65CF', '\uAC00\uC871'],
  ['\u5BB6\u4EBA', '\uAC00\uC871'],
]);

function canonicalizeList(values, normalizer) {
  const source = Array.isArray(values) ? values : String(values ?? '').split(/[,.\u00B7]/);
  const seen = new Set();
  const result = [];
  source.forEach((value) => {
    const normalized = normalizer(value);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    result.push(normalized);
  });
  return result;
}

export function canonicalizeCourseRegion(value) {
  const source = String(value ?? '').trim();
  if (!source) return '';
  const key = compactKey(source);
  return REGION_ALIASES.get(key) ?? source;
}

export function canonicalizeCourseRegions(values) {
  return canonicalizeList(values, canonicalizeCourseRegion);
}

export function canonicalizeTravelStyle(value) {
  const source = String(value ?? '').trim();
  if (!source) return '';
  const key = compactKey(source);
  return STYLE_ALIASES.get(key) ?? source;
}

export function canonicalizeTravelStyles(values) {
  return canonicalizeList(values, canonicalizeTravelStyle);
}

export function canonicalizeCompanion(value) {
  const source = String(value ?? '').trim();
  if (!source) return '';
  const key = compactKey(source);
  return COMPANION_ALIASES.get(key) ?? source;
}
