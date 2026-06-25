import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { matchesSearchText, normalizeSearchText } from '../src/utils/searchText.js';

assert.equal(normalizeSearchText('  COEX   K-POP  '), 'coex k-pop');
assert.equal(matchesSearchText(['Lotte World Tower Seoul Sky'], 'World Tower'), true);
assert.equal(matchesSearchText(['Seongsan Ilchulbong', '성산일출봉'], 'Ilchul'), true);
assert.equal(matchesSearchText(['도깨비', 'Goblin', '공유, 김고은'], '고은'), true);
assert.equal(matchesSearchText(['Bukchon Asian Cultural Art Museum'], 'Asian Cultural'), true);
assert.equal(matchesSearchText(['Bukchon Asian Cultural Art Museum'], 'Cultural Art'), true);
assert.equal(matchesSearchText(['COEX K-POP Square'], 'K-POP'), true);
assert.equal(matchesSearchText(['COEX K-POP Square'], 'Square'), true);

const searchView = readFileSync('src/views/SearchView.vue', 'utf8');
assert.match(searchView, /route\.query\.focus/, 'SearchView must react to the focus route query used by Explore.');
assert.match(searchView, /watch\(\s*locale/, 'SearchView must restore focus after locale-driven placeholder/render updates.');
assert.match(searchView, /requestAnimationFrame/, 'SearchView focus must be deferred past render/locale remount frames.');
assert.doesNotMatch(searchView, /startsWith\(|indexOf\([^\n]*\)\s*===\s*0/, 'SearchView must not use prefix-only search checks.');

console.log('Search focus and contains-regression checks passed.');
