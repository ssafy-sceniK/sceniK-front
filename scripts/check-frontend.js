import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const requiredFiles = [
  'index.html',
  'package.json',
  'vite.config.js',
  'src/main.js',
  'src/App.vue',
  'src/styles.css',
  'src/router/index.js',
  'src/data/mockData.js',
  'src/stores/contentStore.js',
  'src/stores/placeStore.js',
  'src/stores/searchStore.js',
  'src/stores/uiStore.js',
  'src/api/contentApi.js',
  'src/api/placeApi.js',
  'src/api/searchApi.js',
  'src/views/HomeView.vue',
  'src/views/CourseView.vue',
  'src/views/AiResultView.vue',
  'src/components/brand/BrandLogo.vue',
  'src/components/layout/BottomNav.vue',
  'src/components/content/ContentCard.vue',
  'src/components/place/PlaceCard.vue',
];

const forbiddenPatterns = [
  'react',
  'tailwind',
  'bootstrap',
  'material ui',
  'radix',
  'zustand',
  'redux',
];

function listFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (name === 'node_modules') return [];
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

const missingFiles = requiredFiles.filter((file) => !existsSync(file));

if (missingFiles.length > 0) {
  console.error(`Missing required files: ${missingFiles.join(', ')}`);
  process.exit(1);
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const scripts = packageJson.scripts ?? {};
const dependencies = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
};

['vue', 'vue-router', 'pinia', 'axios', '@vitejs/plugin-vue', 'vite'].forEach((name) => {
  if (!dependencies[name]) {
    console.error(`Missing required dependency: ${name}`);
    process.exit(1);
  }
});

if (!scripts.dev || !scripts.build) {
  console.error('package.json must include dev and build scripts.');
  process.exit(1);
}

const sourceText = listFiles('src')
  .filter((file) => /\.(js|css|vue)$/.test(file))
  .map((file) => readFileSync(file, 'utf8').toLowerCase())
  .join('\n');

const forbidden = forbiddenPatterns.filter((pattern) => sourceText.includes(pattern));

if (forbidden.length > 0) {
  console.error(`Forbidden technology keyword found in source: ${forbidden.join(', ')}`);
  process.exit(1);
}

const topNav = readFileSync('src/components/layout/TopNav.vue', 'utf8');
const splashView = readFileSync('src/views/SplashView.vue', 'utf8');
const brandLogo = readFileSync('src/components/brand/BrandLogo.vue', 'utf8');
const shellCss = readFileSync('src/styles/shell.css', 'utf8');
const baseCss = readFileSync('src/styles/base.css', 'utf8');
const homeView = readFileSync('src/views/HomeView.vue', 'utf8');
const aiLoadingView = readFileSync('src/views/AiLoadingView.vue', 'utf8');
const communityView = readFileSync('src/views/CommunityView.vue', 'utf8');
const myPageView = readFileSync('src/views/MyPageView.vue', 'utf8');

if (!topNav.includes('BrandLogo') || !splashView.includes('BrandLogo')) {
  console.error('TopNav and SplashView must render the shared BrandLogo component.');
  process.exit(1);
}

if ([topNav, splashView].some((file) => file.includes('scenik-logo-brand-20260521.svg'))) {
  console.error('Active app logo must not reference the previous SVG logo asset.');
  process.exit(1);
}

if (!brandLogo.includes('scenik-logo__sceni') || !brandLogo.includes('scenik-logo__k')) {
  console.error('BrandLogo must render the text-only sceniK wordmark spans.');
  process.exit(1);
}

if (brandLogo.includes('<svg') || brandLogo.includes('data:image/svg') || brandLogo.includes('<canvas') || brandLogo.includes('<img')) {
  console.error('BrandLogo must not use SVG, canvas, or image logo rendering.');
  process.exit(1);
}

if (brandLogo.includes("fillText('K'") || brandLogo.includes('drawEaveLayer') || brandLogo.includes('destination-out')) {
  console.error('BrandLogo must not reintroduce the previous canvas K or motif renderer.');
  process.exit(1);
}

if (!brandLogo.includes('scenik-logo--font-dit-magi') || brandLogo.includes('useRoute') || brandLogo.includes('logoFontVariant')) {
  console.error('BrandLogo must use the final Dit Magi logo treatment globally, without route-based font switching.');
  process.exit(1);
}

if (/\.scenik-logo__k\s*\{[^}]*color\s*:/m.test(shellCss)) {
  console.error('The active text logo K must inherit the same color as sceni.');
  process.exit(1);
}

if (/(^|\n)\.scenik-logo__k\s*\{[^}]*font-weight\s*:/m.test(shellCss)) {
  console.error('The final logo must not give K a separate base font weight.');
  process.exit(1);
}

if (!shellCss.includes('Logo Dit Magi')) {
  console.error('Missing final active logo font: Logo Dit Magi');
  process.exit(1);
}

['Logo CHABUL', 'Logo Aspect Range', 'Logo Ciguatera', 'Logo OGG'].forEach((fontName) => {
  if (shellCss.includes(fontName)) {
    console.error(`Final active app logo CSS should not load route-test font: ${fontName}`);
    process.exit(1);
  }
});

if (!/\.scenik-logo__sceni,\s*\.scenik-logo__k\s*\{[^}]*font-style:\s*normal\s*;[^}]*letter-spacing:\s*0\s*;/m.test(shellCss)) {
  console.error('Final logo must keep sceni and K in one shared base text rule.');
  process.exit(1);
}

if (!/\.scenik-logo--font-dit-magi\s+\.scenik-logo__sceni,\s*\.scenik-logo--font-dit-magi\s+\.scenik-logo__k\s*\{[^}]*font-weight:\s*1000\s*;[^}]*-webkit-text-stroke:\s*0\.45px\s+currentColor\s*;/m.test(shellCss)) {
  console.error('Dit Magi test logo must render sceni and K with the same maximum weight plus optical bold stroke.');
  process.exit(1);
}

if (!homeView.includes('const homePopularRouteLimit = 3') || !homeView.includes('visibleRouteItems')) {
  console.error('Home popular routes must render a three-card preview before the full routes page.');
  process.exit(1);
}

if (/v-for="course in routeItems"/m.test(homeView)) {
  console.error('Home popular routes must not render the full routeItems collection.');
  process.exit(1);
}

if (
  !aiLoadingView.includes('loadingProgress')
  || !aiLoadingView.includes('loading-orbit')
  || !aiLoadingView.includes('role="progressbar"')
  || !aiLoadingView.includes('loading-steps')
) {
  console.error('AI loading screen must use the circular progress loader with visible step progress.');
  process.exit(1);
}

if (aiLoadingView.includes('progress-bar') || shellCss.includes('.progress-bar')) {
  console.error('AI loading screen must not use the old straight progress bar.');
  process.exit(1);
}

if (!/\.top-nav\s*\{[^}]*padding:\s*0 12px 0 16px\s*;/m.test(shellCss)) {
  console.error('Top navigation actions must keep the tighter right-side alignment.');
  process.exit(1);
}

if (!/\.top-actions\s*\{[^}]*gap:\s*2px\s*;/m.test(shellCss)) {
  console.error('Top navigation actions must keep the tighter notification/settings gap.');
  process.exit(1);
}

if (!/html\s*\{[^}]*scrollbar-gutter:\s*stable both-edges\s*;[^}]*overflow-y:\s*scroll\s*;/m.test(baseCss)) {
  console.error('The app must reserve a stable vertical scrollbar gutter to prevent tab-to-tab horizontal shifts.');
  process.exit(1);
}

if (!communityView.includes(':title="isPostDetail ? \'게시글\' : composeMode ? \'커뮤니티\' : \'\'"')) {
  console.error('Community main tabs must use the same logo-led header as the other primary tabs.');
  process.exit(1);
}

if (!myPageView.includes('<AppLayout>')) {
  console.error('My Page must use the same logo-led header as the other primary tabs.');
  process.exit(1);
}

console.log('Frontend structure and forbidden-stack checks passed.');
