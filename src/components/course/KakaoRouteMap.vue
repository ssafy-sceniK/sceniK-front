<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { loadKakaoMaps } from '../../utils/kakaoMaps.js';

const props = defineProps({
  stops: {
    type: Array,
    default: () => [],
  },
  region: {
    type: String,
    default: '',
  },
  regions: {
    type: Array,
    default: () => [],
  },
});

const mapElement = ref(null);
const statusMessage = ref('');
let map;
let markers = [];
let polyline;

const appKey = import.meta.env.VITE_KAKAO_MAP_APP_KEY || import.meta.env.VITE_KAKAO_MAP_JAVASCRIPT_KEY;
const mapStops = computed(() => props.stops.filter((stop) => (
  isSelectedRegionPlace(stop)
  && Number.isFinite(Number(stop.latitude))
  && Number.isFinite(Number(stop.longitude))
)));
const hasHiddenStops = computed(() => props.stops.length > mapStops.value.length);

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

function isSelectedRegionPlace(stop) {
  const regions = props.regions.length ? props.regions : String(props.region || '').split(/[,.·]/).map((region) => region.trim()).filter(Boolean);
  if (!regions.length) return true;
  return regions.some((region) => {
    const selected = normalizeRegion(region);
    return normalizeRegion(stop?.region) === selected || normalizeRegion(stop?.address) === selected;
  });
}

function clearMapObjects() {
  markers.forEach((marker) => marker.setMap(null));
  markers = [];
  if (polyline) {
    polyline.setMap(null);
    polyline = null;
  }
}

async function renderMap() {
  clearMapObjects();
  if (!mapElement.value) return;
  if (!appKey) {
    statusMessage.value = '카카오맵 JavaScript 키를 설정하면 지도가 표시됩니다.';
    return;
  }
  if (!mapStops.value.length) {
    statusMessage.value = '좌표가 있는 선택 지역 장소만 지도에 표시됩니다.';
    return;
  }

  try {
    const kakaoMaps = await loadKakaoMaps(appKey);
    const first = mapStops.value[0];
    if (!map) {
      map = new kakaoMaps.Map(mapElement.value, {
        center: new kakaoMaps.LatLng(Number(first.latitude), Number(first.longitude)),
        level: 5,
      });
    }

    const bounds = new kakaoMaps.LatLngBounds();
    const path = mapStops.value.map((stop) => {
      const position = new kakaoMaps.LatLng(Number(stop.latitude), Number(stop.longitude));
      bounds.extend(position);
      const marker = new kakaoMaps.Marker({
        map,
        position,
        title: stop.placeName ?? stop.name ?? '장소',
      });
      markers.push(marker);
      return position;
    });

    if (path.length > 1) {
      polyline = new kakaoMaps.Polyline({
        map,
        path,
        strokeWeight: 4,
        strokeColor: '#1455ff',
        strokeOpacity: 0.8,
        strokeStyle: 'solid',
      });
    }

    map.setBounds(bounds);
    statusMessage.value = hasHiddenStops.value ? '좌표가 있는 선택 지역 장소만 지도에 표시됩니다.' : '';
  } catch (error) {
    console.warn('Kakao route map render failed', error);
    statusMessage.value = '지도를 불러오지 못했습니다.';
  }
}

watch(() => [props.stops, props.region, props.regions], renderMap, { deep: true });

onMounted(renderMap);

onBeforeUnmount(() => {
  clearMapObjects();
});
</script>

<template>
  <div class="kakao-route-map">
    <div ref="mapElement" class="kakao-route-map__canvas"></div>
    <p v-if="statusMessage" class="kakao-route-map__notice">{{ statusMessage }}</p>
  </div>
</template>
