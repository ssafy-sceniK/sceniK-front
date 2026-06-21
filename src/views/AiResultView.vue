<script setup>
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import BaseButton from '../components/common/BaseButton.vue';
import EmptyState from '../components/common/EmptyState.vue';
import KakaoRouteMap from '../components/course/KakaoRouteMap.vue';
import CourseSaveStatusPanel from '../components/course/CourseSaveStatusPanel.vue';
import { useUiStore } from '../stores/uiStore.js';
import { formatDateRange, getTripDurationDays } from '../utils/tripDates.js';

const router = useRouter();
const uiStore = useUiStore();
const route = computed(() => uiStore.generatedRoute);
const selectedDay = ref(1);
const showActionMenu = ref(false);
const showShareSheet = ref(false);
const savingRoute = ref(false);
const saveError = ref('');
const saveNotice = ref(null);
const routeCandidateMap = computed(() => new Map((route.value?.candidatePlaces ?? [])
  .map((place) => [place.placeId, place])));
const selectedRegions = computed(() => {
  const regions = Array.isArray(route.value?.regions) && route.value.regions.length
    ? route.value.regions
    : String(route.value?.region || uiStore.courseConditions.region || '').split(/[,.·]/).map((region) => region.trim()).filter(Boolean);
  return regions.length ? regions : ['서울'];
});
const selectedRegion = computed(() => selectedRegions.value.join(','));
const selectedRegionLabel = computed(() => selectedRegions.value.join(', '));
const routePlaces = computed(() => (route.value?.days ?? []).flatMap((day) => day.places ?? []).map((stop) => ({
  ...routeCandidateMap.value.get(stop.placeId),
  ...stop,
  placeName: stop.placeName ?? stop.name ?? routeCandidateMap.value.get(stop.placeId)?.placeName ?? routeCandidateMap.value.get(stop.placeId)?.name,
})).filter((stop) => isSelectedRegionPlace(stop)) ?? []);
const stops = computed(() => (route.value?.days.find((day) => day.dayNumber === selectedDay.value)?.places ?? []).map((stop) => ({
  ...routeCandidateMap.value.get(stop.placeId),
  ...stop,
  placeName: stop.placeName ?? stop.name ?? routeCandidateMap.value.get(stop.placeId)?.placeName ?? routeCandidateMap.value.get(stop.placeId)?.name,
})).filter((stop) => isSelectedRegionPlace(stop)));
const dayTabs = computed(() => route.value?.days.map((day) => day.dayNumber) ?? []);
const placeCount = computed(() => routePlaces.value.length);
const resultMeta = computed(() => {
  if (!route.value) return '';
  return [
    `장소 ${placeCount.value}곳`,
    route.value.transport,
    route.value.companion ?? uiStore.courseConditions.companion,
  ].filter(Boolean).join(' · ');
});
const shareSummary = computed(() => {
  if (!route.value) return '';
  return `장소 ${placeCount.value}곳 · Day 1~${route.value.durationDays}`;
});
const shareText = computed(() => route.value ? `${route.value.title}\n${route.value.summary}` : 'sceniK AI Course');
const saveStatusRows = computed(() => {
  if (!route.value) return [];
  return [
    { label: '장소', value: `${placeCount.value}곳` },
    { label: '선택 콘텐츠', value: contentLabel.value },
    { label: '지역', value: selectedRegionLabel.value },
    { label: '여행 기간', value: travelPeriodLabel.value },
    { label: '이동수단', value: route.value.transport ?? uiStore.courseConditions.transport },
    { label: '예산', value: route.value.budget ?? uiStore.courseConditions.budget },
    { label: '테마', value: themeLabel.value },
    { label: '숙소', value: lodgingInfo.value ? lodgingInfo.value.name : '없음' },
  ];
});
const contentLabel = computed(() => {
  if (!route.value) return '';
  if (route.value.contentTitle) return route.value.contentTitle;
  const titles = (route.value.candidatePlaces ?? []).map((place) => place.relatedContentTitle).filter(Boolean);
  return [...new Set(titles)].join(', ') || '선택 콘텐츠';
});
const themeLabel = computed(() => {
  const styles = Array.isArray(route.value?.travelStyles) && route.value.travelStyles.length
    ? route.value.travelStyles
    : String(route.value?.style ?? uiStore.courseConditions.style ?? '').split(/[,.·]/).map((style) => style.trim()).filter(Boolean);
  return styles.join(', ') || '선택 안 함';
});
const travelPeriodLabel = computed(() => {
  const source = {
    startDate: route.value?.startDate ?? uiStore.courseConditions.startDate,
    endDate: route.value?.endDate ?? uiStore.courseConditions.endDate,
  };
  const range = route.value?.dateRangeLabel || formatDateRange(source);
  const days = route.value?.requestedDurationDays || getTripDurationDays(source) || route.value?.durationDays;
  return `${range} · ${days}일`;
});
const lodgingInfo = computed(() => {
  const address = route.value?.hotelAddress?.trim() || uiStore.courseConditions.hotelAddress?.trim();
  if (!address) return null;
  const tokens = address.split(/\s+/).filter(Boolean);
  const name = tokens.slice(-2).join(' ') || '숙소 위치';
  return { name, address };
});
const isSaved = computed(() => Boolean(route.value?.routeId && uiStore.savedCourses.some((course) => course.routeId === route.value.routeId)) || saveNotice.value?.tone === 'success');

watch(route, (value) => {
  selectedDay.value = value?.days?.[0]?.dayNumber ?? 1;
}, { immediate: true });

async function saveRoute() {
  if (!route.value || savingRoute.value) return;
  showActionMenu.value = false;
  saveError.value = '';
  saveNotice.value = {
    tone: 'info',
    title: 'AI 코스를 저장하는 중입니다.',
    text: '검증된 장소와 일정 정보를 내 코스에 저장하고 있습니다.',
  };
  savingRoute.value = true;
  const saved = await uiStore.saveCourse(route.value);
  savingRoute.value = false;
  if (!saved) {
    saveError.value = uiStore.routeError || 'AI 코스를 저장하지 못했습니다.';
    saveNotice.value = {
      tone: 'error',
      title: '저장하지 못했습니다.',
      text: saveError.value,
    };
    return;
  }
  saveNotice.value = {
    tone: 'success',
    title: '저장되었습니다.',
    text: '저장 후 내 코스에서 다시 수정할 수 있어요.',
  };
}

function openShareSheet() {
  if (!uiStore.requireAuth('로그인하면 코스를 공유할 수 있습니다.')) return;
  showActionMenu.value = false;
  showShareSheet.value = true;
}

function editCourse() {
  if (!route.value) return;
  showActionMenu.value = false;
  router.push('/ai/edit');
}

function post() {
  if (!route.value) return;
  const created = uiStore.createPost({
    title: route.value.title,
    body: route.value.summary,
    region: selectedRegion.value,
    duration: `${route.value.durationDays}일`,
    routeId: route.value.routeId,
    tags: ['AI Course', selectedRegion.value, route.value.style].filter(Boolean),
  });
  if (created) router.push('/community');
}

function stopPlace(stop) {
  return routeCandidateMap.value.get(stop.placeId) ?? stop;
}

function stopTags(stop) {
  return [stopCategory(stop)];
}

function stopCategory(stop) {
  const place = stopPlace(stop);
  return place?.category || stop.category || '촬영지';
}

function normalizeRegion(value) {
  const normalized = String(value ?? '').replace(/\s+/g, '');
  if (normalized.startsWith('서울')) return '서울';
  if (normalized.startsWith('부산')) return '부산';
  if (normalized.startsWith('인천')) return '인천';
  if (normalized.startsWith('대구')) return '대구';
  if (normalized.startsWith('대전')) return '대전';
  if (normalized.startsWith('광주')) return '광주';
  if (normalized.startsWith('울산')) return '울산';
  if (normalized.startsWith('세종')) return '세종';
  if (normalized.startsWith('경기')) return '경기';
  if (normalized.startsWith('강원')) return '강원';
  if (normalized.startsWith('충북') || normalized.startsWith('충청북도')) return '충북';
  if (normalized.startsWith('충남') || normalized.startsWith('충청남도')) return '충남';
  if (normalized.startsWith('전북') || normalized.startsWith('전라북도')) return '전북';
  if (normalized.startsWith('전남') || normalized.startsWith('전라남도')) return '전남';
  if (normalized.startsWith('경북') || normalized.startsWith('경상북도')) return '경북';
  if (normalized.startsWith('경남') || normalized.startsWith('경상남도')) return '경남';
  if (normalized.startsWith('제주')) return '제주';
  return normalized;
}

function isSelectedRegionPlace(place) {
  if (!selectedRegions.value.length) return true;
  return selectedRegions.value.some((region) => (
    normalizeRegion(place?.region) === normalizeRegion(region)
    || normalizeRegion(place?.address) === normalizeRegion(region)
  ));
}

function closeShareSheet() {
  showShareSheet.value = false;
}

function notifyShareOption(label) {
  uiStore.notify(`${label} 공유 옵션을 준비했습니다.`);
}

function copyShareLink() {
  navigator.clipboard?.writeText?.(shareText.value)
    .then(() => uiStore.notify('링크가 복사되었습니다.'))
    .catch(() => uiStore.notify('공유 문구가 준비되었습니다.'));
  closeShareSheet();
}

async function shareMessage() {
  if (navigator.share && route.value) {
    await navigator.share({
      title: route.value.title,
      text: route.value.summary,
    }).catch(() => {});
  } else {
    notifyShareOption('메시지');
  }
  closeShareSheet();
}

function saveFromShareSheet() {
  void saveRoute();
  closeShareSheet();
}

function postFromShareSheet() {
  closeShareSheet();
  post();
}
</script>

<template>
  <main class="app-shell ai-result-shell">
    <section v-if="route" class="ai-result-card">
      <header class="ai-result-topbar">
        <h1>코스 결과</h1>
        <button
          type="button"
          class="result-menu-button"
          aria-label="코스 메뉴"
          aria-controls="ai-result-action-menu"
          :aria-expanded="showActionMenu"
          @click="showActionMenu = !showActionMenu"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" /></svg>
        </button>
        <div v-if="showActionMenu" class="result-menu-backdrop" @click="showActionMenu = false">
          <div id="ai-result-action-menu" class="result-menu-popover" role="menu" @click.stop>
            <button type="button" role="menuitem" @click="openShareSheet">
              <span class="result-menu-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 10.8 6.8-4.1M8.6 13.2l6.8 4.1" /></svg>
              </span>
              공유
            </button>
            <button type="button" role="menuitem" @click="editCourse">
              <span class="result-menu-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" /><path d="m14 7 3 3" /></svg>
              </span>
              편집
            </button>
          </div>
        </div>
      </header>

      <div class="ai-result-scroll">
        <h2>{{ route.title }}</h2>
        <p class="ai-result-meta">{{ resultMeta }}</p>

        <CourseSaveStatusPanel
          title="생성된 AI 코스"
          eyebrow=""
          description=""
          :rows="saveStatusRows"
          :notice="saveNotice"
        />

        <KakaoRouteMap :stops="stops" :regions="selectedRegions" />

        <div v-if="dayTabs.length > 1" class="day-tabs result-day-tabs">
          <button v-for="day in dayTabs" :key="day" type="button" :class="{ active: day === selectedDay }" @click="selectedDay = day">
            Day {{ day }}
          </button>
        </div>

        <div class="prototype-timeline">
          <article v-for="(stop, index) in stops" :key="`${stop.placeId}-${index}`" class="prototype-timeline-item">
            <span class="prototype-timeline-dot"></span>
            <div>
              <small>{{ stop.recommendedTime }}</small>
              <strong>{{ stop.placeName }}</strong>
              <p>{{ stopCategory(stop) }}</p>
              <div class="prototype-stop-tags">
                <span v-for="tag in stopTags(stop)" :key="tag">{{ tag }}</span>
              </div>
            </div>
          </article>
        </div>
      </div>

      <footer class="ai-result-footer">
        <BaseButton class="ai-result-save-button" variant="secondary" block :disabled="savingRoute || isSaved" @click="saveRoute">
          {{ isSaved ? '저장됨' : savingRoute ? '저장 중' : '저장' }}
        </BaseButton>
        <BaseButton block @click="router.push('/home')">완료</BaseButton>
      </footer>

      <div v-if="showShareSheet" class="sheet-backdrop ai-result-share-backdrop" @click.self="closeShareSheet">
        <div class="bottom-sheet ai-result-share-sheet" role="dialog" aria-modal="true" aria-label="코스 공유">
          <div class="sheet-handle"></div>
          <h2>{{ route.title }}</h2>
          <p>{{ shareSummary }}</p>
          <div class="ai-share-options">
            <button type="button" @click="notifyShareOption('카카오톡'); closeShareSheet()"><b class="kakao">💬</b><span>카카오톡</span></button>
            <button type="button" @click="notifyShareOption('인스타그램'); closeShareSheet()"><b class="instagram">📷</b><span>인스타그램</span></button>
            <button type="button" @click="shareMessage"><b class="message">💬</b><span>메시지</span></button>
            <button type="button" @click="copyShareLink"><b class="link">🔗</b><span>링크 복사</span></button>
          </div>
          <div class="ai-share-actions">
            <button type="button" @click="saveFromShareSheet">마이페이지에 저장</button>
            <button type="button" @click="postFromShareSheet">커뮤니티에 게시</button>
          </div>
          <button type="button" class="ai-share-close" @click="closeShareSheet">닫기</button>
        </div>
      </div>
    </section>

    <section v-else class="result-empty">
      <EmptyState
        icon="AI"
        tone="route"
        title="생성된 코스가 없습니다"
        text="좋아하는 K-content를 선택하면 검증 장소 기반 코스를 만들 수 있어요."
        action-label="AI Course 만들기"
        action-to="/ai"
      />
    </section>
  </main>
</template>
