<script setup>
import { computed, onMounted, ref, watch, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import { AnimatePresence, motion } from 'motion-v';
import AppLayout from '../components/layout/AppLayout.vue';
import BaseButton from '../components/common/BaseButton.vue';
import ChipGroup from '../components/common/ChipGroup.vue';
import { useContentStore } from '../stores/contentStore.js';
import { usePlaceStore } from '../stores/placeStore.js';
import { useUiStore } from '../stores/uiStore.js';
import { dateAfter, ensureDateRange, formatDateRange, getTripDurationDays } from '../utils/tripDates.js';
import { motionVariants } from '../utils/motion.js';
import { TRANSPORT_MODE_OPTIONS, TRANSPORT_MODES, normalizeCarDays, normalizeTransportModes, transportLabel } from '../utils/transport.js';

const router = useRouter();
const contentStore = useContentStore();
const placeStore = usePlaceStore();
const uiStore = useUiStore();
const relatedPlaces = ref([]);
const candidateLoading = ref(false);
const showGenerateConfirm = ref(false);
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
const selectedSummaryTitle = computed(() => {
  if (selectedContents.value.length) return selectedContents.value.map((content) => content.title).join(', ');
  if (selectedContentIds.value.length) return `${selectedContentIds.value.length}개 콘텐츠 선택됨`;
  return '선택한 콘텐츠가 없습니다';
});

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
const today = dateAfter(0);
const tripDurationDays = computed(() => getTripDurationDays(uiStore.courseConditions));
const tripDateRangeLabel = computed(() => formatDateRange(uiStore.courseConditions));
const budgetMaxLimit = computed(() => Math.max(budgetBounds.min, tripDurationDays.value * budgetBounds.perDayMax));
const canGenerate = computed(() => selectedContentIds.value.length > 0 && !candidateLoading.value);
const budgetRangeLabel = computed(() => formatBudgetRange(uiStore.courseConditions.budgetMin, uiStore.courseConditions.budgetMax));
const budgetMinPercent = computed(() => budgetPercent(uiStore.courseConditions.budgetMin));
const budgetMaxPercent = computed(() => budgetPercent(uiStore.courseConditions.budgetMax));
const travelStyleOptions = ['감성 여행', '맛집 중심', '촬영지 중심', '숨은 명소'];
const transportModeOptions = TRANSPORT_MODE_OPTIONS;
const selectedTravelStyles = computed(() => {
  const styles = Array.isArray(uiStore.courseConditions.travelStyles)
    ? uiStore.courseConditions.travelStyles.filter(Boolean)
    : [];
  return styles.length ? styles : [uiStore.courseConditions.style].filter(Boolean);
});
const travelStyleLabel = computed(() => selectedTravelStyles.value.join(', ') || '선택 안 함');
const selectedTransportModes = computed(() => normalizeTransportModes(uiStore.courseConditions.transportModes, uiStore.courseConditions.transport));
const selectedCarDays = computed(() => normalizeCarDays(uiStore.courseConditions.carDays, tripDurationDays.value, selectedTransportModes.value));
const carDayOptions = computed(() => Array.from({ length: tripDurationDays.value }, (_, index) => index + 1));
const hasCarTransport = computed(() => selectedTransportModes.value.includes(TRANSPORT_MODES.CAR));
const transportSummaryLabel = computed(() => transportLabel(selectedTransportModes.value, selectedCarDays.value, tripDurationDays.value));
const aiContextRows = computed(() => [
  { label: '선택 콘텐츠', value: selectedSummaryTitle.value },
  { label: '지역', value: selectedRegionLabel.value },
  { label: '여행 기간', value: `${tripDateRangeLabel.value} · ${tripDurationDays.value}일` },
  { label: '이동 수단', value: transportSummaryLabel.value },
  { label: '예산/테마', value: `${budgetRangeLabel.value} · ${travelStyleLabel.value}` },
  { label: '숙소', value: uiStore.courseConditions.hotelAddress?.trim() || '입력 안 함' },
]);

function sameNumberArray(left = [], right = []) {
  return left.length === right.length && left.every((value, index) => Number(value) === Number(right[index]));
}

function sameStringArray(left = [], right = []) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function syncTransportCondition(modes = selectedTransportModes.value, carDays = selectedCarDays.value) {
  const normalizedModes = normalizeTransportModes(modes, uiStore.courseConditions.transport);
  const effectiveModes = normalizedModes.includes(TRANSPORT_MODES.CAR)
    ? [TRANSPORT_MODES.PUBLIC_TRANSIT, TRANSPORT_MODES.CAR]
    : [TRANSPORT_MODES.PUBLIC_TRANSIT];
  const normalizedCarDays = normalizeCarDays(
    effectiveModes.includes(TRANSPORT_MODES.CAR) ? carDays : [],
    tripDurationDays.value,
    effectiveModes,
  );
  const label = transportLabel(effectiveModes, normalizedCarDays, tripDurationDays.value);

  if (!sameStringArray(uiStore.courseConditions.transportModes ?? [], effectiveModes)) {
    uiStore.courseConditions.transportModes = [...effectiveModes];
  }
  if (!sameNumberArray(uiStore.courseConditions.carDays ?? [], normalizedCarDays)) {
    uiStore.courseConditions.carDays = [...normalizedCarDays];
  }
  if (uiStore.courseConditions.transport !== label) {
    uiStore.courseConditions.transport = label;
  }
}

function toggleTransportMode(mode) {
  if (mode === TRANSPORT_MODES.PUBLIC_TRANSIT) {
    syncTransportCondition([TRANSPORT_MODES.PUBLIC_TRANSIT], []);
    return;
  }

  if (selectedTransportModes.value.includes(TRANSPORT_MODES.CAR)) {
    syncTransportCondition([TRANSPORT_MODES.PUBLIC_TRANSIT], []);
    return;
  }

  syncTransportCondition([TRANSPORT_MODES.PUBLIC_TRANSIT, TRANSPORT_MODES.CAR], [selectedCarDays.value[0] ?? 1]);
}

function toggleCarDay(day) {
  const current = new Set(selectedCarDays.value);
  if (current.has(day)) {
    if (current.size === 1) return;
    current.delete(day);
  } else {
    current.add(day);
  }
  syncTransportCondition([TRANSPORT_MODES.PUBLIC_TRANSIT, TRANSPORT_MODES.CAR], [...current]);
}
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

function openGenerateConfirm() {
  if (!canGenerate.value) return;
  showGenerateConfirm.value = true;
}

function confirmGenerate() {
  uiStore.persist();
  showGenerateConfirm.value = false;
  router.push('/ai/loading');
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
  syncTransportCondition();
});
</script>

<template>
  <AppLayout title="여행 조건" back>
    <section class="course-step">
      <div class="progress-line"><b style="width: 50%"></b><span>2/4</span></div>
      <div class="selected-summary compact-selected-summary">
        <span class="badge ai">선택 콘텐츠</span>
        <strong>{{ selectedSummaryTitle }}</strong>
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
          <p>{{ tripDateRangeLabel }} · 선택 기간 {{ tripDurationDays }}일</p>
        </div>
      </div>
      <div class="condition-block">
        <h2>이동 수단</h2>
        <div class="chip-row wrap">
          <button
            v-for="option in transportModeOptions"
            :key="option.value"
            type="button"
            class="chip"
            :class="{ selected: selectedTransportModes.includes(option.value) }"
            :aria-pressed="selectedTransportModes.includes(option.value)"
            @click="toggleTransportMode(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
        <div v-if="hasCarTransport" class="car-day-card">
          <div>
            <strong>차량 이용일</strong>
            <small>선택하지 않은 날은 대중교통으로 이동합니다.</small>
          </div>
          <div class="car-day-grid">
            <button
              v-for="day in carDayOptions"
              :key="day"
              type="button"
              :class="{ selected: selectedCarDays.includes(day) }"
              :aria-pressed="selectedCarDays.includes(day)"
              @click="toggleCarDay(day)"
            >
              Day {{ day }}
            </button>
          </div>
        </div>
        <p class="condition-help">{{ transportSummaryLabel }}</p>
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

      <div class="sticky-actions">
        <BaseButton class="course-primary-cta" block :disabled="!canGenerate" @click="openGenerateConfirm">
          <span>{{ canGenerate ? 'AI 코스 생성하기' : '콘텐츠를 먼저 선택해 주세요' }}</span>
        </BaseButton>
      </div>

      <AnimatePresence>
        <motion.div v-if="showGenerateConfirm" class="condition-confirm-backdrop" v-bind="motionVariants.backdrop()" @click.self="showGenerateConfirm = false">
        <motion.section class="condition-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="condition-confirm-title" v-bind="motionVariants.dialog()">
          <div>
            <span class="badge ai">AI 코스 생성</span>
            <h2 id="condition-confirm-title">이 조건으로 AI 코스를 생성할까요?</h2>
          </div>
          <dl class="condition-confirm-rows">
            <template v-for="row in aiContextRows" :key="row.label">
              <dt>{{ row.label }}</dt>
              <dd>{{ row.value }}</dd>
            </template>
          </dl>
          <div class="condition-confirm-actions">
            <BaseButton variant="ghost" block @click="showGenerateConfirm = false">취소</BaseButton>
            <BaseButton block @click="confirmGenerate">생성하기</BaseButton>
          </div>
        </motion.section>
        </motion.div>
      </AnimatePresence>
    </section>
  </AppLayout>
</template>
