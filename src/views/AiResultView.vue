<script setup>
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import BaseButton from '../components/common/BaseButton.vue';
import EmptyState from '../components/common/EmptyState.vue';
import AiPromptContextSummary from '../components/ai/AiPromptContextSummary.vue';
import CourseSaveStatusPanel from '../components/course/CourseSaveStatusPanel.vue';
import { useUiStore } from '../stores/uiStore.js';

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
const routePlaces = computed(() => (route.value?.days ?? []).flatMap((day) => day.places ?? []).map((stop) => ({
  ...routeCandidateMap.value.get(stop.placeId),
  ...stop,
  placeName: stop.placeName ?? stop.name ?? routeCandidateMap.value.get(stop.placeId)?.placeName ?? routeCandidateMap.value.get(stop.placeId)?.name,
})) ?? []);
const stops = computed(() => route.value?.days.find((day) => day.dayNumber === selectedDay.value)?.places ?? []);
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
    { label: '코스 상태', value: '생성된 AI 코스' },
    { label: '검증 장소', value: `${placeCount.value}곳` },
    { label: '일정', value: `${route.value.durationDays}일` },
    { label: '저장 후 동작', value: '내 코스에서 수정·공유·삭제 가능' },
  ];
});
const resultEvidenceRows = computed(() => {
  if (!route.value) return [];
  return [
    { label: '추천 기준', value: '검증된 장소 데이터 기반 추천' },
    { label: '추천 이유', value: route.value.trustMessage ?? '선택한 K-content와 지역 조건에 맞는 실제 촬영지를 연결했습니다.' },
    { label: '예상 체류 시간', value: route.value.days?.map((day) => `Day ${day.dayNumber}: ${day.estimatedTravelTime ?? '이동 시간 확인 필요'}`).join(' · ') },
    { label: '이동 팁', value: route.value.transport ?? uiStore.courseConditions.transport },
  ];
});

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
    region: route.value.region,
    duration: `${route.value.durationDays}일`,
    routeId: route.value.routeId,
    tags: ['AI Course', route.value.region, route.value.style].filter(Boolean),
  });
  if (created) router.push('/community');
}

function stopPlace(stop) {
  return routeCandidateMap.value.get(stop.placeId) ?? stop;
}

function stopTags(stop) {
  const place = stopPlace(stop);
  return [
    place?.category ?? '검증 장소',
    stop.travelTip?.match(/(도보|지하철|버스|이동)[^,.·]*/)?.[0] ?? '동선 확인',
  ].filter(Boolean).slice(0, 2);
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
            <button type="button" role="menuitem" @click="saveRoute">
              <span class="result-menu-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" /></svg>
              </span>
              저장
            </button>
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
          description="저장 전 장소 수와 일정 조건을 확인하세요. 저장 후 마이페이지에서 다시 수정할 수 있습니다."
          :rows="saveStatusRows"
          :notice="saveNotice"
        />

        <AiPromptContextSummary class="result" title="사용된 조건 요약 · 검증된 장소 데이터 기반 추천" :rows="resultEvidenceRows" />

        <div class="ai-result-map-card">
          <span>지도 기반 동선</span>
        </div>

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
              <p>{{ stop.reason }}</p>
              <div class="prototype-stop-tags">
                <span v-for="tag in stopTags(stop)" :key="tag">{{ tag }}</span>
              </div>
            </div>
          </article>
        </div>
      </div>

      <footer class="ai-result-footer">
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
