import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import {
  buildContentSearchFields,
  buildPlaceSearchFields,
  matchesSearchText,
  normalizeSearchText,
} from '../src/utils/searchText.js';

assert.equal(normalizeSearchText('  COEX   K-POP  '), 'coex k-pop');
assert.equal(matchesSearchText(['Lotte World Tower Seoul Sky'], 'World Tower'), true);
assert.equal(matchesSearchText(['Seongsan Ilchulbong'], 'Ilchul'), true);
assert.equal(matchesSearchText(['Goblin', 'Gong Yoo, Kim Go-eun'], 'go-eun'), true);
assert.equal(matchesSearchText(['Bukchon Asian Cultural Art Museum'], 'Asian Cultural'), true);
assert.equal(matchesSearchText(['Bukchon Asian Cultural Art Museum'], 'Cultural Art'), true);
assert.equal(matchesSearchText(['COEX K-POP Square'], 'K-POP'), true);
assert.equal(matchesSearchText(['COEX K-POP Square'], 'Square'), true);

const searchTestHelpers = {
  localizeContent: (content, locale) => (locale === 'en'
    ? { ...content, title: 'Goblin', castNames: 'Gong Yoo, Kim Go-eun, Lee Dong-wook', tags: ['Romance'] }
    : content),
  localizeSystemTag: (value, _t, locale) => (locale === 'en' && value === '\uB85C\uB9E8\uC2A4' ? 'Romance' : value),
};

const goblinContent = {
  contentId: 'C_DRAMA_005',
  title: '\uB3C4\uAE68\uBE44',
  category: '\uB4DC\uB77C\uB9C8',
  description: '\uBD88\uBA78\uC758 \uB3C4\uAE68\uBE44\uC640 \uC778\uAC04 \uC2E0\uBD80\uC758 \uD310\uD0C0\uC9C0 \uB85C\uB9E8\uC2A4 \uB4DC\uB77C\uB9C8.',
  castNames: '\uACF5\uC720, \uAE40\uACE0\uC740, \uC774\uB3D9\uC6B1',
  tags: ['\uAC15\uB989', '\uC8FC\uBB38\uC9C4', '\uB85C\uB9E8\uC2A4'],
};
const goblinFields = buildContentSearchFields(goblinContent, searchTestHelpers);
assert.equal(matchesSearchText(goblinFields, 'Goblin'), true);
assert.equal(matchesSearchText(goblinFields, 'Gong Yoo'), true);
assert.equal(matchesSearchText(goblinFields, 'Romance'), true);
assert.equal(matchesSearchText(goblinFields, '\uB3C4\uAE68\uBE44'), true);

const coexPlace = {
  placeId: 'P_0213',
  name: '\uCF54\uC5D1\uC2A4 K-POP \uAD11\uC7A5',
  placeName: '\uCF54\uC5D1\uC2A4 K-POP \uAD11\uC7A5',
  region: '\uC11C\uC6B8',
  district: '\uAC15\uB0A8\uAD6C',
  category: '\uACF5\uC5F0\uC7A5',
  description: 'K-POP events and filming take place at the COEX square.',
};
const coexFields = buildPlaceSearchFields(coexPlace);
assert.equal(matchesSearchText(coexFields, 'COEX'), true);
assert.equal(matchesSearchText(coexFields, 'K-POP Square'), true);
assert.equal(matchesSearchText(coexFields, 'COEX K-POP\u5E83\u5834'), true);
assert.equal(matchesSearchText(coexFields, 'COEX K-POP\u5E7F\u573A'), true);
assert.equal(matchesSearchText(coexFields, '\uCF54\uC5D1\uC2A4'), true);

const oreumPlace = {
  placeId: 'P_TEST_OREUM',
  name: '\uC0C8\uBCC4\uC624\uB984',
  placeName: '\uC0C8\uBCC4\uC624\uB984',
  region: '\uC81C\uC8FC',
  district: '\uC81C\uC8FC\uC2DC',
  category: '\uAD00\uAD11\uC9C0',
  description: 'A representative oreum attraction in Jeju.',
};
const oreumFields = buildPlaceSearchFields(oreumPlace);
assert.equal(matchesSearchText(oreumFields, 'Saebyeol Oreum'), true);
assert.equal(matchesSearchText(oreumFields, 'Oreum'), true);
assert.equal(matchesSearchText(oreumFields, '\uC624\uB984'), true);

const searchView = readFileSync('src/views/SearchView.vue', 'utf8');
assert.match(searchView, /route\.query\.focus/, 'SearchView must react to the focus route query used by Explore.');
assert.match(searchView, /watch\(\s*locale/, 'SearchView must restore focus after locale-driven placeholder/render updates.');
assert.match(searchView, /requestAnimationFrame/, 'SearchView focus must be deferred past render/locale remount frames.');
assert.doesNotMatch(searchView, /startsWith\(|indexOf\([^\n]*\)\s*===\s*0/, 'SearchView must not use prefix-only search checks.');

const contentStore = readFileSync('src/stores/contentStore.js', 'utf8');
const placeStore = readFileSync('src/stores/placeStore.js', 'utf8');
const searchStore = readFileSync('src/stores/searchStore.js', 'utf8');
assert.match(contentStore, /localizeContent/, 'ContentStore must pass content localization into search fields.');
assert.match(placeStore, /localizePlace/, 'PlaceStore must pass place localization into search fields.');
assert.match(searchStore, /useContentStore/, 'SearchStore must merge local content-store multilingual search results.');
assert.match(searchStore, /usePlaceStore/, 'SearchStore must merge local place-store multilingual search results.');
assert.match(searchStore, /mergeSearchResults/, 'SearchStore must merge API and local fallback results without duplicate cards.');

console.log('Search focus, contains, and multilingual-regression checks passed.');