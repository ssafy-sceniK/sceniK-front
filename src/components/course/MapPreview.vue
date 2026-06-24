<script setup>
import { useI18n } from 'vue-i18n';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { loadKakaoMaps } from '../../utils/kakaoMaps.js';
import { fetchPlaceDetail } from '../../api/placeApi.js';
import { localizeContent, localizePlace } from '../../i18n/systemContent.js';

const { t, locale } = useI18n();

const props = defineProps({
  routePlaces: { type: Array, default: () => [] },
  totalPlaces: { type: Number, default: null },
  showDetailLink: { type: Boolean, default: true },
  drawPath: { type: Boolean, default: true },
});

const DEFAULT_CENTER = { latitude: 37.5665, longitude: 126.978 };
const KAKAO_MAP_ICON_URL = 'https://t1.kakaocdn.net/kakaocorp/kakaocorp/admin/1ca66319017800001.png';
const appKey = (import.meta.env.VITE_KAKAO_MAP_APP_KEY || import.meta.env.VITE_KAKAO_MAP_JAVASCRIPT_KEY)?.trim();
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
const totalPlaceCount = computed(() => {
  const explicitCount = Number(props.totalPlaces);
  return Number.isFinite(explicitCount) && explicitCount >= 0 ? explicitCount : props.routePlaces.length;
});
const missingCoordinateCount = computed(() => Math.max(0, totalPlaceCount.value - validPlaces.value.length));
const mapCountLabel = computed(() => (missingCoordinateCount.value > 0
  ? t('autoPass.ui_f346dce058', { value0: validPlaces.value.length, value1: totalPlaceCount.value })
  : t('autoPass.ui_37333dd7ed', { value0: validPlaces.value.length })));
const localizedSelectedPlace = computed(() => (selectedPlace.value ? displayPlace(selectedPlace.value) : null));

let kakaoMaps;
let map;
let markers = [];
let routePathLine;
let resizeObserver;
let infoOverlay;

function closePlaceInfo() {
  infoOverlay?.setMap(null);
  infoOpen.value = false;
}

function displayPlace(place) {
  return localizePlace(place, locale.value, t) ?? place;
}

function placeName(place) {
  const localized = displayPlace(place);
  return localized.placeName || localized.name || t('autoPass.ui_7d31290a71');
}

function placeAddress(place) {
  const localized = displayPlace(place);
  return localized.address || [localized.region, localized.district].filter(Boolean).join(' ');
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
    const localized = localizeContent({ ...item, contentId, title }, locale.value, t);
    const displayTitle = localized?.title ?? title;
    const key = `${contentId}:${displayTitle}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push({ contentId, title: displayTitle });
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
  const localizedPlace = displayPlace(place);
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
  closeButton.setAttribute('aria-label', t('autoPass.ui_429f39711d'));
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
  appendTextElement(body, 'strong', 'kakao-place-info__name', placeName(localizedPlace));
  appendTextElement(body, 'span', 'kakao-place-info__address', placeAddress(localizedPlace));
  appendTextElement(body, 'span', 'kakao-place-info__category', localizedPlace.category);

  const links = document.createElement('div');
  links.className = 'kakao-place-info__links';
  const kakaoLink = appendLink(
    links,
    'kakao-place-info__link kakao-place-info__link--external',
    '',
    `https://map.kakao.com/link/search/${encodeURIComponent(`${placeName(localizedPlace)} ${localizedPlace.address ?? ''}`.trim())}`,
    true,
  );
  kakaoLink?.setAttribute('aria-label', t('autoPass.ui_2976925371'));
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
    relatedScroller.setAttribute('aria-label', t('autoPass.ui_0343cc46a7'));
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
      relatedButton?.setAttribute('aria-label', t('autoPass.ui_c70234a765', { value0: contentItem.title }));
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

function clearRoutePath() {
  routePathLine?.setMap(null);
  routePathLine = undefined;
}

function clearMarkers() {
  closePlaceInfo();
  infoOverlay = undefined;
  clearRoutePath();
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
  const pathPositions = [];
  validPlaces.value.forEach((place) => {
    const position = new kakaoMaps.LatLng(Number(place.latitude), Number(place.longitude));
    pathPositions.push(position);
    const marker = new kakaoMaps.Marker({ map, position, title: placeName(place) });
    kakaoMaps.event.addListener(marker, 'click', () => {
      selectedPlace.value = place;
      selectedMarker.value = marker;
      map.panTo(position);
      void openPlaceInfo();
    });
    markers.push(marker);
    bounds.extend(position);
  });

  if (props.drawPath && pathPositions.length > 1) {
    routePathLine = new kakaoMaps.Polyline({
      map,
      path: pathPositions,
      strokeWeight: 4,
      strokeColor: '#0052ff',
      strokeOpacity: 0.82,
      strokeStyle: 'solid',
    });
  }

  if (validPlaces.value.length === 1) {
    map.setCenter(pathPositions[0]);
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
    <div ref="mapContainer" class="kakao-map" role="img" :aria-label="t('autoPass.ui_b8d2758afe')"></div>
    <div v-if="mapStatus !== 'ready'" class="map-status" role="status">
      <strong v-if="mapStatus === 'loading'">{{ t('autoPass.ui_cf6c4fe1f6') }}</strong>
      <template v-else-if="mapStatus === 'missing-key'">
        <strong>{{ t('autoPass.ui_5a852b5a97') }}</strong>
        <span><code>VITE_KAKAO_MAP_JAVASCRIPT_KEY</code>{{ t('autoPass.ui_ceef3b8e8b') }}</span>
      </template>
      <template v-else-if="mapStatus === 'empty'">
        <strong>{{ t('autoPass.ui_333724b276') }}</strong>
        <span v-if="totalPlaceCount">{{ t('autoPass.ui_74a3fd1bf9', { count: totalPlaceCount }) }}</span>
        <span v-else>{{ t('autoPass.ui_caf0e366cc') }}</span>
      </template>
      <template v-else>
        <strong>{{ t('autoPass.ui_e28793c8b2') }}</strong>
        <span>{{ t('autoPass.ui_7eb34401bb') }}</span>
      </template>
    </div>
    <button
      v-if="localizedSelectedPlace?.placeId && props.showDetailLink"
      class="map-place-popover"
      type="button"
      @click="goToSelectedPlace"
    >
      <span class="map-place-popover__summary">
        <strong>{{ localizedSelectedPlace.placeName }}</strong>
        <span>{{ localizedSelectedPlace.address || [localizedSelectedPlace.region, localizedSelectedPlace.district].filter(Boolean).join(' ') }}</span>
      </span>
      <small>{{ t('autoPass.ui_1a31ee0b4b') }}</small>
    </button>
    <span v-if="mapStatus === 'ready' && !infoOpen" class="map-label">{{ mapCountLabel }}</span>
  </div>
</template>
