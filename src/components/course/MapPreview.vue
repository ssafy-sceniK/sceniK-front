<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { loadKakaoMaps } from '../../utils/kakaoMaps.js';

const props = defineProps({
  routePlaces: { type: Array, default: () => [] },
});

const DEFAULT_CENTER = { latitude: 37.5665, longitude: 126.978 };
const appKey = import.meta.env.VITE_KAKAO_MAP_JAVASCRIPT_KEY?.trim();
const mapContainer = ref(null);
const mapStatus = ref('loading');
const selectedPlace = ref(null);
const validPlaces = computed(() => props.routePlaces.filter((place) => {
  const latitude = Number(place.latitude);
  const longitude = Number(place.longitude);
  return Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude >= -90
    && latitude <= 90
    && longitude >= -180
    && longitude <= 180;
}));

let kakaoMaps;
let map;
let markers = [];
let resizeObserver;

function clearMarkers() {
  markers.forEach((marker) => marker.setMap(null));
  markers = [];
}

function renderPlaces() {
  if (!map || !kakaoMaps) return;

  clearMarkers();
  selectedPlace.value = null;

  if (!validPlaces.value.length) {
    map.setCenter(new kakaoMaps.LatLng(DEFAULT_CENTER.latitude, DEFAULT_CENTER.longitude));
    map.setLevel(8);
    mapStatus.value = 'empty';
    return;
  }

  const bounds = new kakaoMaps.LatLngBounds();
  validPlaces.value.forEach((place) => {
    const position = new kakaoMaps.LatLng(Number(place.latitude), Number(place.longitude));
    const marker = new kakaoMaps.Marker({ map, position, title: place.placeName });
    kakaoMaps.event.addListener(marker, 'click', () => {
      selectedPlace.value = place;
      map.panTo(position);
    });
    markers.push(marker);
    bounds.extend(position);
  });

  if (validPlaces.value.length === 1) {
    map.setCenter(bounds.getSouthWest());
    map.setLevel(4);
  } else {
    map.setBounds(bounds, 48, 48, 48, 48);
  }
  mapStatus.value = 'ready';
}

async function initializeMap() {
  mapStatus.value = 'loading';
  try {
    kakaoMaps = await loadKakaoMaps(appKey);
    await nextTick();
    map = new kakaoMaps.Map(mapContainer.value, {
      center: new kakaoMaps.LatLng(DEFAULT_CENTER.latitude, DEFAULT_CENTER.longitude),
      level: 8,
    });
    map.addControl(new kakaoMaps.ZoomControl(), kakaoMaps.ControlPosition.RIGHT);
    renderPlaces();

    resizeObserver = new ResizeObserver(() => map?.relayout());
    resizeObserver.observe(mapContainer.value);
  } catch (error) {
    mapStatus.value = error.message === 'KAKAO_MAP_KEY_MISSING' ? 'missing-key' : 'error';
  }
}

watch(validPlaces, renderPlaces);
onMounted(initializeMap);
onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  clearMarkers();
});
</script>

<template>
  <div class="map-preview" :class="`map-preview--${mapStatus}`">
    <div ref="mapContainer" class="kakao-map" role="img" aria-label="카카오 지도 장소 위치"></div>
    <div v-if="mapStatus !== 'ready'" class="map-status" role="status">
      <strong v-if="mapStatus === 'loading'">지도를 불러오는 중입니다</strong>
      <template v-else-if="mapStatus === 'missing-key'">
        <strong>카카오 지도 JavaScript 키가 필요합니다</strong>
        <span><code>VITE_KAKAO_MAP_JAVASCRIPT_KEY</code>를 설정해 주세요.</span>
      </template>
      <template v-else-if="mapStatus === 'empty'">
        <strong>표시할 좌표가 없습니다</strong>
        <span>장소의 위도와 경도를 확인해 주세요.</span>
      </template>
      <template v-else>
        <strong>카카오 지도를 불러오지 못했습니다</strong>
        <span>JavaScript 키와 SDK 도메인 설정을 확인해 주세요.</span>
      </template>
    </div>
    <RouterLink
      v-if="selectedPlace?.placeId"
      class="map-place-popover"
      :to="`/places/${selectedPlace.placeId}`"
    >
      <strong>{{ selectedPlace.placeName }}</strong>
      <span>{{ selectedPlace.address || `${selectedPlace.region} ${selectedPlace.district}` }}</span>
      <small>장소 상세 보기</small>
    </RouterLink>
    <span v-if="mapStatus === 'ready'" class="map-label">{{ validPlaces.length }}개 장소 표시 중</span>
  </div>
</template>
