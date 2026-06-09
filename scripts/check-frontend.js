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
  'src/assets/brand/scenik_single_wordmark_blue.png',
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

if (
  !brandLogo.includes('scenik_single_wordmark_blue.png')
  || !brandLogo.includes('<img')
  || !brandLogo.includes('alt="sceniK"')
) {
  console.error('BrandLogo must render the blue PNG generated from the original sceniK wordmark asset.');
  process.exit(1);
}

if (brandLogo.includes('<svg') || brandLogo.includes('data:image/svg') || brandLogo.includes('<canvas')) {
  console.error('BrandLogo must not use the previous inline SVG or canvas logo rendering.');
  process.exit(1);
}

if (brandLogo.includes("fillText('K'") || brandLogo.includes('drawEaveLayer') || brandLogo.includes('destination-out')) {
  console.error('BrandLogo must not reintroduce the previous canvas K or motif renderer.');
  process.exit(1);
}

if (brandLogo.includes('useRoute') || brandLogo.includes('logoFontVariant')) {
  console.error('BrandLogo must use one global logo treatment without route-based switching.');
  process.exit(1);
}

if (!/\.scenik-logo\s*\{[^}]*color:\s*var\(--color-primary\)\s*;/m.test(shellCss)) {
  console.error('The active logo must use the primary sceniK blue token.');
  process.exit(1);
}

if (/#000(?:000)?\b|black/i.test(brandLogo) || /#000(?:000)?\b|black/i.test(shellCss.match(/\.scenik-logo[\s\S]*?\.home-screen/)?.[0] ?? '')) {
  console.error('The active logo must not render as a black logo in visible headers.');
  process.exit(1);
}

['Logo CHABUL', 'Logo Aspect Range', 'Logo Ciguatera', 'Logo OGG'].forEach((fontName) => {
  if (shellCss.includes(fontName)) {
    console.error(`Final active app logo CSS should not load route-test font: ${fontName}`);
    process.exit(1);
  }
});

if (!/\.scenik-logo__image\s*\{[^}]*object-fit:\s*contain\s*;[^}]*object-position:\s*left center\s*;/m.test(shellCss)) {
  console.error('Final logo image must preserve the original PNG proportions and left header alignment.');
  process.exit(1);
}

if (/scenik-logo__(wordmark|route|plane|svg)/.test(brandLogo) || /scenik-logo__(wordmark|route|plane|svg)/.test(shellCss)) {
  console.error('The previous inline SVG logo classes must not remain active.');
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

if (!communityView.includes('SortSegmentedControl') || communityView.includes('<select v-model="sort"')) {
  console.error('Community latest/popular sorting must use the mobile segmented control instead of a native select.');
  process.exit(1);
}

if (!myPageView.includes('<AppLayout>')) {
  console.error('My Page must use the same logo-led header as the other primary tabs.');
  process.exit(1);
}

console.log('Frontend structure and forbidden-stack checks passed.');
