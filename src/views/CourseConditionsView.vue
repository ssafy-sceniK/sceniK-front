<script setup>
import { computed, onMounted, ref, watch, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '../components/layout/AppLayout.vue';
import BaseButton from '../components/common/BaseButton.vue';
import ChipGroup from '../components/common/ChipGroup.vue';
import EmptyState from '../components/common/EmptyState.vue';
import PlaceCard from '../components/place/PlaceCard.vue';
import { useContentStore } from '../stores/contentStore.js';
import { usePlaceStore } from '../stores/placeStore.js';
import { useUiStore } from '../stores/uiStore.js';
import { dateAfter, ensureDateRange, formatDateRange, getTripDurationDays } from '../utils/tripDates.js';

const router = useRouter();
const contentStore = useContentStore();
const placeStore = usePlaceStore();
const uiStore = useUiStore();
const relatedPlaces = ref([]);
const candidateLoading = ref(false);
const budgetBounds = {
  min: 50000,
  max: 10000000,
  step: 100000,
};
const selectedContentIds = computed(() => {
  const ids = Array.isArray(uiStore.selectedContentIds) && uiStore.selectedContentIds.length
    ? uiStore.selectedContentIds
    : [uiStore.selectedContentId].filter(Boolean);
  return [...new Set(ids.filter(Boolean))];
});
const selectedContents = computed(() => selectedContentIds.value
  .map((contentId) => contentStore.items.find((content) => content.contentId === contentId))
  .filter(Boolean));

function uniquePlaces(list = []) {
  return [...list.reduce((map, place) => {
    if (place?.placeId && !map.has(place.placeId)) map.set(place.placeId, place);
    return map;
  }, new Map()).values()];
}

async function loadRelatedPlaces() {
  if (!selectedContentIds.value.length) {
    relatedPlaces.value = [];
    return;
  }
  candidateLoading.value = true;
  const results = await Promise.allSettled(
    selectedContentIds.value.map((contentId) => contentStore.getRelatedPlaces(contentId)),
  );
  relatedPlaces.value = uniquePlaces(results
    .filter((result) => result.status === 'fulfilled')
    .flatMap((result) => result.value)
    .filter((place) => place?.verified !== false));
  candidateLoading.value = false;
}

async function loadAiInputs() {
  await Promise.all([
    contentStore.items.length ? Promise.resolve() : contentStore.load(),
    placeStore.items.length ? Promise.resolve() : placeStore.load(),
  ]);
  await loadRelatedPlaces();
}

onMounted(loadAiInputs);
watch(() => selectedContentIds.value.join('|'), () => {
  void loadRelatedPlaces();
});
const regionOptions = computed(() => {
  const counts = relatedPlaces.value.reduce((acc, place) => {
    acc.set(place.region, (acc.get(place.region) ?? 0) + 1);
    return acc;
  }, new Map());
  const relatedRegions = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([region]) => region);
  const allRegions = placeStore.regions.filter((item) => item && item !== '전체');
  return relatedRegions.length ? relatedRegions : allRegions.length ? allRegions : ['서울'];
});
const exactRelatedPlaces = computed(() => relatedPlaces.value.filter((place) => place.region === uiStore.courseConditions.region));
const today = dateAfter(0);
const tripDurationDays = computed(() => getTripDurationDays(uiStore.courseConditions));
const tripDateRangeLabel = computed(() => formatDateRange(uiStore.courseConditions));
const targetCandidateCount = computed(() => Math.max(6, tripDurationDays.value * 2));
const fallbackCandidatePlaces = computed(() => {
  const exactIds = new Set(exactRelatedPlaces.value.map((place) => place.placeId));
  return placeStore.items
    .filter((place) => place.verified !== false && place.region === uiStore.courseConditions.region && !exactIds.has(place.placeId))
    .slice(0, Math.max(0, targetCandidateCount.value - exactRelatedPlaces.value.length));
});
const candidatePlaces = computed(() => uniquePlaces([...exactRelatedPlaces.value, ...fallbackCandidatePlaces.value]));
const candidateDayLimit = computed(() => Math.max(1, candidatePlaces.value.length));
const generatedDayCount = computed(() => Math.min(tripDurationDays.value, candidateDayLimit.value));
const canGenerate = computed(() => selectedContentIds.value.length > 0 && !candidateLoading.value);
const budgetRangeLabel = computed(() => formatBudgetRange(uiStore.courseConditions.budgetMin, uiStore.courseConditions.budgetMax));
const budgetMinPercent = computed(() => budgetPercent(uiStore.courseConditions.budgetMin));
const budgetMaxPercent = computed(() => budgetPercent(uiStore.courseConditions.budgetMax));
const candidateHelpText = computed(() => {
  if (candidateLoading.value) return '선택한 콘텐츠와 연결된 실제 장소를 확인하고 있어요.';
  if (!selectedContentIds.value.length) return 'AI 코스를 만들 콘텐츠를 먼저 선택해 주세요.';
  if (!candidatePlaces.value.length) return '미리보기 장소가 비어 있어도 백엔드가 선택 콘텐츠와 지역 조건으로 검증 장소를 다시 찾습니다.';
  if (!fallbackCandidatePlaces.value.length) return '선택한 K-content와 직접 연결된 실제 장소만 표시하고 있어요.';
  return `직접 연결 장소 ${exactRelatedPlaces.value.length}곳에 같은 지역의 검증 장소 ${fallbackCandidatePlaces.value.length}곳을 더했어요.`;
});
const selectedSummaryTitle = computed(() => {
  if (selectedContents.value.length) return selectedContents.value.map((content) => content.title).join(', ');
  if (selectedContentIds.value.length) return `${selectedContentIds.value.length}개 콘텐츠 선택됨`;
  return '선택된 콘텐츠가 없습니다';
});

function formatWon(value) {
  const amount = Number(value) || 0;
  if (amount >= 10000) return `${Math.round(amount / 10000)}만원`;
  return `${amount.toLocaleString('ko-KR')}원`;
}

function formatBudgetRange(min, max) {
  return `${formatWon(min)} ~ ${formatWon(max)}`;
}

function budgetPercent(value) {
  const range = budgetBounds.max - budgetBounds.min;
  return `${Math.round(((Number(value) - budgetBounds.min) / range) * 100)}%`;
}

function normalizeBudgetRange() {
  const min = Number(uiStore.courseConditions.budgetMin ?? budgetBounds.min);
  const max = Number(uiStore.courseConditions.budgetMax ?? budgetBounds.max);
  uiStore.courseConditions.budgetMin = Math.max(budgetBounds.min, Math.min(min, budgetBounds.max));
  uiStore.courseConditions.budgetMax = Math.max(uiStore.courseConditions.budgetMin, Math.min(max, budgetBounds.max));
  uiStore.courseConditions.budget = formatBudgetRange(uiStore.courseConditions.budgetMin, uiStore.courseConditions.budgetMax);
}

watchEffect(() => {
  if (regionOptions.value.length && !regionOptions.value.includes(uiStore.courseConditions.region)) {
    uiStore.courseConditions.region = regionOptions.value[0];
  }

  const normalizedDateRange = ensureDateRange(uiStore.courseConditions);
  uiStore.courseConditions.startDate = normalizedDateRange.startDate;
  uiStore.courseConditions.endDate = normalizedDateRange.endDate;
  uiStore.courseConditions.duration = tripDurationDays.value;
  normalizeBudgetRange();
});
</script>

<template>
  <AppLayout title="여행 조건" back>
    <section class="course-step">
      <div class="progress-line"><b style="width: 50%"></b><span>2/4</span></div>
      <div class="selected-summary">
        <span class="badge ai">선택 콘텐츠</span>
        <strong>{{ selectedSummaryTitle }}</strong>
        <p>{{ selectedContentIds.length }}개 콘텐츠 · 실제 장소 데이터 기반</p>
      </div>

      <div class="condition-block">
        <h2>지역</h2>
        <ChipGroup v-model="uiStore.courseConditions.region" :items="regionOptions" />
      </div>
      <div class="condition-block">
        <h2>여행 날짜</h2>
        <div class="date-range-card">
          <label class="date-field">
            <span>출발 날짜</span>
            <input v-model="uiStore.courseConditions.startDate" type="date" :min="today" />
          </label>
          <label class="date-field">
            <span>복귀 날짜</span>
            <input
              v-model="uiStore.courseConditions.endDate"
              type="date"
              :min="uiStore.courseConditions.startDate || today"
            />
          </label>
          <p>
            {{ tripDateRangeLabel }} · 선택 기간 {{ tripDurationDays }}일
            <span v-if="generatedDayCount !== tripDurationDays">
              · 현재 장소 수 기준 결과는 {{ generatedDayCount }}일 코스로 조정돼요
            </span>
          </p>
        </div>
      </div>
      <div class="condition-block">
        <h2>이동 수단</h2>
        <ChipGroup v-model="uiStore.courseConditions.transport" :items="['대중교통', '도보 중심', '차량']" />
      </div>
      <div class="condition-block">
        <h2>동행 유형</h2>
        <ChipGroup v-model="uiStore.courseConditions.companion" :items="['혼자', '친구', '연인', '가족']" />
      </div>
      <div class="condition-block">
        <h2>예산</h2>
        <div class="budget-range-card">
          <div class="budget-range-head">
            <span>총 예산 범위</span>
            <strong>{{ budgetRangeLabel }}</strong>
          </div>
          <div class="budget-dual-range" :style="{ '--budget-min': budgetMinPercent, '--budget-max': budgetMaxPercent }">
            <span class="budget-track" aria-hidden="true"><span></span></span>
            <input
              v-model.number="uiStore.courseConditions.budgetMin"
              class="budget-range-input min-range"
              type="range"
              aria-label="최소 예산"
              :min="budgetBounds.min"
              :max="budgetBounds.max"
              :step="budgetBounds.step"
              @input="normalizeBudgetRange"
            />
            <input
              v-model.number="uiStore.courseConditions.budgetMax"
              class="budget-range-input max-range"
              type="range"
              aria-label="최대 예산"
              :min="budgetBounds.min"
              :max="budgetBounds.max"
              :step="budgetBounds.step"
              @input="normalizeBudgetRange"
            />
          </div>
          <div class="budget-range-values">
            <span>최소 <b>{{ formatWon(uiStore.courseConditions.budgetMin) }}</b></span>
            <span>최대 <b>{{ formatWon(uiStore.courseConditions.budgetMax) }}</b></span>
          </div>
        </div>
      </div>
      <div class="condition-block">
        <h2>여행 스타일</h2>
        <ChipGroup v-model="uiStore.courseConditions.style" :items="['감성 여행', '맛집 중심', '촬영지 중심', '성지순례']" />
      </div>

      <div class="section-header"><h2>AI 코스에 사용할 장소</h2><span>{{ candidatePlaces.length }}곳</span></div>
      <p class="candidate-helper">{{ candidateHelpText }}</p>
      <EmptyState
        v-if="candidateLoading"
        tone="loading"
        compact
        title="장소 후보를 불러오는 중입니다"
        text="선택 콘텐츠와 연결된 검증 장소를 확인하고 있어요."
      />
      <div v-else class="stack-list">
        <PlaceCard v-for="place in candidatePlaces" :key="place.placeId" :place="place" compact />
      </div>

      <div class="sticky-actions">
        <BaseButton class="course-primary-cta" block :disabled="!canGenerate" @click="uiStore.persist(); router.push('/ai/loading')">
          <span>{{ canGenerate ? 'AI 코스 생성하기' : '콘텐츠를 먼저 선택해 주세요' }}</span>
          <small v-if="canGenerate">
            {{ candidatePlaces.length ? `${candidatePlaces.length}곳의 실제 장소로 ${generatedDayCount}일 동선을 만듭니다` : '백엔드 검증 장소 fallback으로 코스를 생성합니다' }}
          </small>
        </BaseButton>
      </div>
    </section>
  </AppLayout>
</template>
