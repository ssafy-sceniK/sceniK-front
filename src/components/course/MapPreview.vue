<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { loadKakaoMaps } from '../../utils/kakaoMaps.js';
import { fetchPlaceDetail } from '../../api/placeApi.js';

const props = defineProps({
  routePlaces: { type: Array, default: () => [] },
  showDetailLink: { type: Boolean, default: true },
});

const DEFAULT_CENTER = { latitude: 37.5665, longitude: 126.978 };
const KAKAO_MAP_ICON_URL = 'https://t1.kakaocdn.net/kakaocorp/kakaocorp/admin/1ca66319017800001.png';
const appKey = import.meta.env.VITE_KAKAO_MAP_JAVASCRIPT_KEY?.trim();
const router = useRouter();
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
  link.draggable = false;
  if (external) {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  } else if (href.startsWith('/')) {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      closePlaceInfo();
      router.push(href);
    });
  }
  parent.appendChild(link);
  return link;
}

function appendButton(parent, className, text, onClick) {
  const button = document.createElement('button');
  button.className = className;
  button.type = 'button';
  button.textContent = text;
  button.draggable = false;
  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    onClick();
  });
  parent.appendChild(button);
  return button;
}

function relatedContentItems(place) {
  const items = [];
  const seen = new Set();

  function addItem(item = {}) {
    const contentId = item.contentId ?? item.relatedContentId;
    const title = item.title ?? item.contentTitle ?? item.relatedContentTitle;
    if (!contentId || !title) return;
    const key = `${contentId}:${title}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push({ contentId, title });
  }

  (place.relatedContents ?? []).forEach(addItem);
  addItem({
    contentId: place.relatedContentId,
    title: place.relatedContentTitle,
  });

  return items;
}

function enableHorizontalChipScroll(scroller) {
  let dragging = false;
  let startX = 0;
  let startScrollLeft = 0;
  let moved = false;
  let suppressClick = false;
  let lastDragAt = 0;

  scroller.addEventListener('pointerdown', (event) => {
    dragging = true;
    moved = false;
    startX = event.clientX;
    startScrollLeft = scroller.scrollLeft;
    scroller.classList.add('is-dragging');
  });

  scroller.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const deltaX = event.clientX - startX;
    if (Math.abs(deltaX) <= 5) return;
    moved = true;
    scroller.scrollLeft = startScrollLeft - deltaX;
    event.preventDefault();
  });

  const stopDragging = () => {
    if (moved) {
      suppressClick = true;
      lastDragAt = Date.now();
      window.setTimeout(() => {
        suppressClick = false;
      }, 180);
    }
    dragging = false;
    moved = false;
    scroller.classList.remove('is-dragging');
  };

  scroller.addEventListener('pointerup', stopDragging);
  scroller.addEventListener('pointercancel', stopDragging);
  scroller.addEventListener('mouseleave', () => {
    if (dragging) stopDragging();
  });
  scroller.addEventListener('click', (event) => {
    if (!suppressClick && Date.now() - lastDragAt > 220) return;
    event.preventDefault();
    event.stopPropagation();
  }, true);
  scroller.addEventListener('wheel', (event) => {
    if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
    scroller.scrollLeft += event.deltaY;
    event.preventDefault();
  }, { passive: false });
}

function placeDetailPath(place) {
  return place?.placeId ? `/places/${place.placeId}` : '';
}

function createInfoWindowContent(place) {
  const content = document.createElement('article');
  content.className = 'kakao-place-info';
  ['click', 'mousedown', 'touchstart', 'pointerdown', 'wheel'].forEach((eventName) => {
    content.addEventListener(eventName, (event) => {
      event.stopPropagation();
    });
  });

  const closeButton = document.createElement('button');
  closeButton.className = 'kakao-place-info__close';
  closeButton.type = 'button';
  closeButton.setAttribute('aria-label', '장소 상세 정보 닫기');
  closeButton.textContent = '×';
  closeButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    closePlaceInfo();
  });
  content.appendChild(closeButton);

  const body = document.createElement('div');
  body.className = 'kakao-place-info__body';
  content.appendChild(body);
  appendTextElement(body, 'strong', 'kakao-place-info__name', placeName(place));
  appendTextElement(body, 'span', 'kakao-place-info__address', place.address || `${place.region ?? ''} ${place.district ?? ''}`.trim());
  appendTextElement(body, 'span', 'kakao-place-info__category', place.category);

  const links = document.createElement('div');
  links.className = 'kakao-place-info__links';
  const kakaoLink = appendLink(
    links,
    'kakao-place-info__link kakao-place-info__link--external',
    '',
    `https://map.kakao.com/link/search/${encodeURIComponent(`${placeName(place)} ${place.address ?? ''}`.trim())}`,
    true,
  );
  kakaoLink?.setAttribute('aria-label', '카카오맵에서 보기');
  if (kakaoLink) {
    const icon = document.createElement('img');
    icon.src = KAKAO_MAP_ICON_URL;
    icon.alt = '';
    icon.loading = 'lazy';
    kakaoLink.appendChild(icon);
  }
  const relatedContents = relatedContentItems(place);
  if (relatedContents.length) {
    const relatedScroller = document.createElement('div');
    relatedScroller.className = 'kakao-place-info__related-scroll';
    relatedScroller.setAttribute('aria-label', '관련 콘텐츠');
    relatedContents.forEach((contentItem) => {
      const relatedButton = appendButton(
        relatedScroller,
        'kakao-place-info__link kakao-place-info__related-chip',
        contentItem.title,
        () => {
          closePlaceInfo();
          router.push(`/contents/${encodeURIComponent(contentItem.contentId)}`);
        },
      );
      relatedButton?.setAttribute('aria-label', `관련 콘텐츠 ${contentItem.title} 보기`);
      relatedButton?.setAttribute('title', contentItem.title);
    });
    enableHorizontalChipScroll(relatedScroller);
    links.appendChild(relatedScroller);
  }
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
    clickable: true,
    xAnchor: 0.5,
    yAnchor: 1.08,
    zIndex: 10,
  });
  infoOpen.value = true;
}

function goToSelectedPlace() {
  const path = placeDetailPath(selectedPlace.value);
  if (path) router.push(path);
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
      void openPlaceInfo();
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
      v-if="selectedPlace?.placeId && props.showDetailLink"
      class="map-place-popover"
      type="button"
      @click="goToSelectedPlace"
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
