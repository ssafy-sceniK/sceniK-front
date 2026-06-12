<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { loadKakaoMaps } from '../../utils/kakaoMaps.js';
import { fetchPlaceDetail } from '../../api/placeApi.js';

const props = defineProps({
  routePlaces: { type: Array, default: () => [] },
  showDetailLink: { type: Boolean, default: true },
});

const DEFAULT_CENTER = { latitude: 37.5665, longitude: 126.978 };
const appKey = import.meta.env.VITE_KAKAO_MAP_JAVASCRIPT_KEY?.trim();
const mapContainer = ref(null);
const mapStatus = ref('loading');
const selectedPlace = ref(null);
const selectedMarker = ref(null);
const infoOpen = ref(false);
const validPlaces = computed(() => props.routePlaces.filter((place) => {
  if (place.latitude === null || place.latitude === undefined || place.latitude === ''
    || place.longitude === null || place.longitude === undefined || place.longitude === '') {
    return false;
  }
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
let infoOverlay;

function closePlaceInfo() {
  infoOverlay?.setMap(null);
  infoOpen.value = false;
}

function placeName(place) {
  return place.placeName || place.name || '장소 정보';
}

function appendTextElement(parent, tagName, className, text) {
  if (!text) return null;
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  parent.appendChild(element);
  return element;
}

function appendLink(parent, className, text, href, external = false) {
  if (!href) return null;
  const link = document.createElement('a');
  link.className = className;
  link.textContent = text;
  link.href = href;
  if (external) {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }
  parent.appendChild(link);
  return link;
}

function createInfoWindowContent(place) {
  const content = document.createElement('article');
  content.className = 'kakao-place-info';

  const closeButton = document.createElement('button');
  closeButton.className = 'kakao-place-info__close';
  closeButton.type = 'button';
  closeButton.setAttribute('aria-label', '장소 상세 정보 닫기');
  closeButton.textContent = '×';
  closeButton.addEventListener('click', closePlaceInfo);
  content.appendChild(closeButton);

  const body = document.createElement('div');
  body.className = 'kakao-place-info__body';
  content.appendChild(body);
  appendTextElement(body, 'strong', 'kakao-place-info__name', placeName(place));
  appendTextElement(body, 'span', 'kakao-place-info__address', place.address || `${place.region ?? ''} ${place.district ?? ''}`.trim());
  appendTextElement(body, 'span', 'kakao-place-info__category', place.category);

  const links = document.createElement('div');
  links.className = 'kakao-place-info__links';
  if (props.showDetailLink) {
    appendLink(links, 'kakao-place-info__link', 'sceniK 상세', place.placeId ? `/places/${place.placeId}` : '');
  }
  appendLink(
    links,
    'kakao-place-info__link',
    '카카오맵에서 보기',
    `https://map.kakao.com/link/search/${encodeURIComponent(`${placeName(place)} ${place.address ?? ''}`.trim())}`,
    true,
  );
  (place.relatedContents ?? []).slice(0, 2).forEach((contentItem) => {
    appendLink(
      links,
      'kakao-place-info__link kakao-place-info__link--related',
      contentItem.title ? `관련 콘텐츠: ${contentItem.title}` : '관련 콘텐츠 보기',
      contentItem.contentId ? `/contents/${contentItem.contentId}` : '',
    );
  });
  if (links.childElementCount) content.appendChild(links);

  return content;
}

async function openPlaceInfo() {
  if (!map || !kakaoMaps || !selectedPlace.value || !selectedMarker.value) return;
  closePlaceInfo();
  let place = selectedPlace.value;
  if (place.placeId && !(place.relatedContents ?? []).length) {
    try {
      place = { ...place, ...await fetchPlaceDetail(place.placeId) };
      selectedPlace.value = place;
    } catch {
      // Basic place information is still sufficient for the map overlay.
    }
  }
  infoOverlay = new kakaoMaps.CustomOverlay({
    map,
    position: selectedMarker.value.getPosition(),
    content: createInfoWindowContent(place),
    xAnchor: 0.5,
    yAnchor: 1.18,
    zIndex: 10,
  });
  infoOpen.value = true;
}

function clearMarkers() {
  closePlaceInfo();
  infoOverlay = undefined;
  markers.forEach((marker) => marker.setMap(null));
  markers = [];
}

function renderPlaces() {
  if (!map || !kakaoMaps) return;

  clearMarkers();
  selectedPlace.value = null;
  selectedMarker.value = null;

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
      selectedMarker.value = marker;
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
    <button
      v-if="selectedPlace?.placeId"
      class="map-place-popover"
      type="button"
      @click="openPlaceInfo"
    >
      <span class="map-place-popover__summary">
        <strong>{{ selectedPlace.placeName }}</strong>
        <span>{{ selectedPlace.address || `${selectedPlace.region} ${selectedPlace.district}` }}</span>
      </span>
      <small>장소 상세 보기</small>
    </button>
    <span v-if="mapStatus === 'ready' && !infoOpen" class="map-label">{{ validPlaces.length }}개 장소 표시 중</span>
  </div>
</template>
