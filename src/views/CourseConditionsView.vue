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
  min: 100000,
  perDayMax: 1000000,
  step: 10000,
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
const selectedRegions = computed(() => {
  const regions = Array.isArray(uiStore.courseConditions.regions)
    ? uiStore.courseConditions.regions.filter(Boolean)
    : [];
  return regions.length ? regions : [uiStore.courseConditions.region].filter(Boolean);
});
const selectedRegionLabel = computed(() => selectedRegions.value.join(', '));
const exactRelatedPlaces = computed(() => relatedPlaces.value.filter((place) => selectedRegions.value.includes(place.region)));
const today = dateAfter(0);
const tripDurationDays = computed(() => getTripDurationDays(uiStore.courseConditions));
const tripDateRangeLabel = computed(() => formatDateRange(uiStore.courseConditions));
const budgetMaxLimit = computed(() => Math.max(budgetBounds.min, tripDurationDays.value * budgetBounds.perDayMax));
const targetCandidateCount = computed(() => Math.max(6, tripDurationDays.value * 2));
const fallbackCandidatePlaces = computed(() => relatedPlaces.value
  .filter((place) => !selectedRegions.value.includes(place.region))
  .slice(0, Math.max(0, targetCandidateCount.value - exactRelatedPlaces.value.length)));
const candidatePlaces = computed(() => uniquePlaces(exactRelatedPlaces.value.length ? exactRelatedPlaces.value : fallbackCandidatePlaces.value));
const generatedDayCount = computed(() => tripDurationDays.value);
const canGenerate = computed(() => selectedContentIds.value.length > 0 && !candidateLoading.value);
const budgetRangeLabel = computed(() => formatBudgetRange(uiStore.courseConditions.budgetMin, uiStore.courseConditions.budgetMax));
const budgetMinPercent = computed(() => budgetPercent(uiStore.courseConditions.budgetMin));
const budgetMaxPercent = computed(() => budgetPercent(uiStore.courseConditions.budgetMax));
const candidateHelpText = computed(() => {
  if (candidateLoading.value) return '선택한 콘텐츠와 연결된 실제 장소를 확인하고 있어요.';
  if (!selectedContentIds.value.length) return 'AI 코스를 만들 콘텐츠를 먼저 선택해 주세요.';
  if (!candidatePlaces.value.length) return '미리보기 장소가 비어 있어도 백엔드가 선택 콘텐츠와 지역 조건으로 검증 장소를 다시 찾습니다.';
  if (exactRelatedPlaces.value.length) return '선택한 K-content와 직접 연결된 실제 장소만 표시하고 있어요.';
  return `선택 지역 장소가 부족해 선택 콘텐츠와 연결된 다른 지역 장소 ${fallbackCandidatePlaces.value.length}곳을 확인하고 있어요.`;
});
const selectedSummaryTitle = computed(() => {
  if (selectedContents.value.length) return selectedContents.value.map((content) => content.title).join(', ');
  if (selectedContentIds.value.length) return `${selectedContentIds.value.length}개 콘텐츠 선택됨`;
  return '선택된 콘텐츠가 없습니다';
});
const aiContextRows = computed(() => [
  { label: '선택 콘텐츠', value: selectedSummaryTitle.value },
  { label: '지역', value: selectedRegionLabel.value },
  { label: '여행 기간', value: `${tripDateRangeLabel.value} · ${tripDurationDays.value}일` },
  { label: '이동 수단', value: uiStore.courseConditions.transport },
  { label: '예산/테마', value: `${budgetRangeLabel.value} · ${travelStyleLabel.value}` },
  { label: '숙소', value: uiStore.courseConditions.hotelAddress?.trim() || '입력 안 함' },
]);
const travelStyleOptions = ['감성 여행', '맛집 중심', '촬영지 중심', '성지순례'];
const selectedTravelStyles = computed(() => {
  const styles = Array.isArray(uiStore.courseConditions.travelStyles)
    ? uiStore.courseConditions.travelStyles.filter(Boolean)
    : [];
  return styles.length ? styles : [uiStore.courseConditions.style].filter(Boolean);
});
const travelStyleLabel = computed(() => selectedTravelStyles.value.join(', ') || '선택 안 함');

function toggleTravelStyle(style) {
  const current = new Set(selectedTravelStyles.value);
  if (current.has(style)) current.delete(style);
  else current.add(style);
  uiStore.courseConditions.travelStyles = [...current];
  uiStore.courseConditions.style = uiStore.courseConditions.travelStyles.join(', ');
}

function toggleRegion(region) {
  const current = new Set(selectedRegions.value);
  if (current.has(region) && current.size > 1) current.delete(region);
  else current.add(region);
  uiStore.courseConditions.regions = [...current];
  uiStore.courseConditions.region = uiStore.courseConditions.regions.join(',');
}

function formatWon(value) {
  const amount = Number(value) || 0;
  if (amount >= 10000) return `${Math.round(amount / 10000)}만원`;
  return `${amount.toLocaleString('ko-KR')}원`;
}

function formatBudgetRange(min, max) {
  return `${formatWon(min)} ~ ${formatWon(max)}`;
}

function budgetPercent(value) {
  const range = budgetMaxLimit.value - budgetBounds.min;
  if (range <= 0) return '0%';
  return `${Math.round(((Number(value) - budgetBounds.min) / range) * 100)}%`;
}

function normalizeBudgetRange() {
  const min = Number(uiStore.courseConditions.budgetMin ?? budgetBounds.min);
  const max = Number(uiStore.courseConditions.budgetMax ?? budgetMaxLimit.value);
  uiStore.courseConditions.budgetMin = Math.max(budgetBounds.min, Math.min(min, budgetMaxLimit.value));
  uiStore.courseConditions.budgetMax = Math.max(uiStore.courseConditions.budgetMin, Math.min(max, budgetMaxLimit.value));
  uiStore.courseConditions.budget = formatBudgetRange(uiStore.courseConditions.budgetMin, uiStore.courseConditions.budgetMax);
}

watchEffect(() => {
  if (!Array.isArray(uiStore.courseConditions.regions) || !uiStore.courseConditions.regions.length) {
    uiStore.courseConditions.regions = [uiStore.courseConditions.region || regionOptions.value[0]].filter(Boolean);
  }
  const validRegions = uiStore.courseConditions.regions.filter((region) => regionOptions.value.includes(region));
  uiStore.courseConditions.regions = validRegions.length ? validRegions : [regionOptions.value[0]];
  uiStore.courseConditions.region = uiStore.courseConditions.regions.join(',');

  const normalizedDateRange = ensureDateRange(uiStore.courseConditions);
  uiStore.courseConditions.startDate = normalizedDateRange.startDate;
  uiStore.courseConditions.endDate = normalizedDateRange.endDate;
  uiStore.courseConditions.duration = tripDurationDays.value;
  normalizeBudgetRange();
  if (!Array.isArray(uiStore.courseConditions.travelStyles) || !uiStore.courseConditions.travelStyles.length) {
    uiStore.courseConditions.travelStyles = [uiStore.courseConditions.style].filter(Boolean);
  }
  uiStore.courseConditions.style = uiStore.courseConditions.travelStyles.join(', ');
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

      <div class="ai-context-panel">
        <div>
          <strong>AI가 참고하는 조건</strong>
          <small>선택한 K-content와 검증 장소 데이터만 사용합니다.</small>
        </div>
        <dl>
          <template v-for="row in aiContextRows" :key="row.label">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </template>
        </dl>
      </div>

      <div class="condition-block">
        <h2>지역</h2>
        <div class="chip-row wrap">
          <button
            v-for="region in regionOptions"
            :key="region"
            type="button"
            class="chip"
            :class="{ selected: selectedRegions.includes(region) }"
            :aria-pressed="selectedRegions.includes(region)"
            @click="toggleRegion(region)"
          >
            {{ region }}
          </button>
        </div>
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
              :max="budgetMaxLimit"
              :step="budgetBounds.step"
              @input="normalizeBudgetRange"
            />
            <input
              v-model.number="uiStore.courseConditions.budgetMax"
              class="budget-range-input max-range"
              type="range"
              aria-label="최대 예산"
              :min="budgetBounds.min"
              :max="budgetMaxLimit"
              :step="budgetBounds.step"
              @input="normalizeBudgetRange"
            />
          </div>
          <div class="budget-range-values">
            <span>최소 <b>{{ formatWon(uiStore.courseConditions.budgetMin) }}</b></span>
            <span>최대 <b>{{ formatWon(uiStore.courseConditions.budgetMax) }}</b></span>
          </div>
          <p class="budget-range-note">선택 기간 기준 최대 {{ formatWon(budgetMaxLimit) }}까지 설정할 수 있어요.</p>
        </div>
      </div>
      <div class="condition-block">
        <h2>숙소 주소 또는 호텔 위치 <span class="optional-label">(선택)</span></h2>
        <label class="hotel-address-field">
          <input
            v-model.trim="uiStore.courseConditions.hotelAddress"
            type="text"
            placeholder="예: 서울특별시 중구 을지로 30 롯데호텔 서울"
            autocomplete="street-address"
          />
        </label>
      </div>
      <div class="condition-block">
        <h2>여행 스타일</h2>
        <div class="chip-row wrap">
          <button
            v-for="style in travelStyleOptions"
            :key="style"
            type="button"
            class="chip"
            :class="{ selected: selectedTravelStyles.includes(style) }"
            @click="toggleTravelStyle(style)"
          >
            {{ style }}
          </button>
        </div>
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
