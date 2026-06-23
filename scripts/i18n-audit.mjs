import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const scanRoots = ['src/views', 'src/components', 'src/stores', 'src/api', 'src/router', 'src/utils'];
const localeFiles = ['ko', 'en', 'ja', 'zh-CN'].map((locale) => ({
  locale,
  file: path.join(rootDir, 'src/i18n/locales', `${locale}.json`),
}));
const ignoredSegments = [
  `${path.sep}src${path.sep}i18n${path.sep}`,
  `${path.sep}src${path.sep}data${path.sep}`,
  `${path.sep}node_modules${path.sep}`,
  `${path.sep}dist${path.sep}`,
];
const ignoredExtensions = new Set(['.css', '.scss', '.map', '.png', '.jpg', '.jpeg', '.webp', '.svg']);
const koreanPattern = /[가-힣]/;
const commentOnlyPattern = /^\s*(\/\/|\*|<!--|-->|\/\*)/;
const literalKeyPattern = /(?:\bt|\$t)\(\s*['"]([A-Za-z0-9_.-]+)['"]/g;
const failOnFindings = process.argv.includes('--fail-on-findings');

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (ignoredSegments.some((segment) => fullPath.includes(segment))) return [];
    if (entry.isDirectory()) return walk(fullPath);
    if (!entry.isFile()) return [];
    if (ignoredExtensions.has(path.extname(entry.name))) return [];
    return [fullPath];
  });
}

function isLikelyUiString(line) {
  const trimmed = line.trim();
  if (!trimmed || commentOnlyPattern.test(trimmed)) return false;
  if (!koreanPattern.test(trimmed)) return false;
  if (trimmed.includes('localizeSystemLabel(') || trimmed.includes('localizePreferenceOption(')) return false;
  return true;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8').replace(String.fromCharCode(0xfeff), ''));
}

function hasPath(object, keyPath) {
  return keyPath.split('.').every((part) => {
    if (!object || typeof object !== 'object' || !(part in object)) return false;
    object = object[part];
    return true;
  });
}

const files = scanRoots.flatMap((scanRoot) => walk(path.join(rootDir, scanRoot)));
const findings = [];
const usedKeys = new Map();

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const relativeFile = path.relative(rootDir, file).replaceAll(path.sep, '/');
  content.split(/\r?\n/).forEach((line, index) => {
    if (!isLikelyUiString(line)) return;
    findings.push({ file: relativeFile, line: index + 1, text: line.trim() });
  });
  for (const match of content.matchAll(literalKeyPattern)) {
    const key = match[1];
    if (key.endsWith('.')) continue;
    if (!usedKeys.has(key)) usedKeys.set(key, new Set());
    usedKeys.get(key).add(relativeFile);
  }
}

const byFile = new Map();
for (const finding of findings) {
  byFile.set(finding.file, (byFile.get(finding.file) ?? 0) + 1);
}

const locales = Object.fromEntries(localeFiles.map(({ locale, file }) => [locale, readJson(file)]));
const missingKeys = [];
for (const key of [...usedKeys.keys()].sort()) {
  for (const locale of Object.keys(locales)) {
    if (!hasPath(locales[locale], key)) {
      missingKeys.push({ key, locale, files: [...usedKeys.get(key)].sort() });
    }
  }
}

console.log(`i18n audit: ${findings.length} likely hardcoded Korean UI lines in ${byFile.size} files.`);
console.log(`i18n audit: ${usedKeys.size} literal i18n keys checked; ${missingKeys.length} missing locale entries.`);

for (const [file, count] of [...byFile.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 30)) {
  console.log(`${String(count).padStart(4, ' ')}  ${file}`);
}

if (findings.length) {
  console.log('\nFirst findings:');
  for (const finding of findings.slice(0, 40)) {
    console.log(`${finding.file}:${finding.line}: ${finding.text}`);
  }
}

if (missingKeys.length) {
  console.log('\nMissing locale keys:');
  for (const item of missingKeys.slice(0, 80)) {
    console.log(`${item.locale}: ${item.key} (${item.files.join(', ')})`);
  }
}

if (failOnFindings && (findings.length || missingKeys.length)) {
  process.exitCode = 1;
}


