<script setup>
import { useI18n } from 'vue-i18n';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { loadKakaoMaps } from '../../utils/kakaoMaps.js';
import { fetchPlaceDetail } from '../../api/placeApi.js';
import { localizeContent, localizePlace } from '../../i18n/systemContent.js';
import { normalizeLocale } from '../../i18n/languages.js';

const { t, locale } = useI18n();

const props = defineProps({
  routePlaces: { type: Array, default: () => [] },
  totalPlaces: { type: Number, default: null },
  showDetailLink: { type: Boolean, default: true },
  drawPath: { type: Boolean, default: true },
});

const DEFAULT_CENTER = { latitude: 37.5665, longitude: 126.978 };
const KAKAO_MAP_ICON_URL = 'https://t1.kakaocdn.net/kakaocorp/kakaocorp/admin/1ca66319017800001.png';
const MAP_LABEL_FALLBACKS = {
  ko: {
    countWithTotal: '\uc9c0\ub3c4\uc5d0 {value0} / {value1}\uac1c \uc7a5\uc18c \ud45c\uc2dc',
    count: '\uc9c0\ub3c4\uc5d0 {value0}\uac1c \uc7a5\uc18c \ud45c\uc2dc',
    placeFallback: '\uc7a5\uc18c \uc815\ubcf4',
    closePlaceDetails: '\uc7a5\uc18c \uc0c1\uc138 \ub2eb\uae30',
    openInKakaoMap: '\uce74\uce74\uc624\ub9f5\uc5d0\uc11c \ubcf4\uae30',
    relatedContent: '\uad00\ub828 \ucf58\ud150\uce20',
    viewRelatedContent: '\uad00\ub828 \ucf58\ud150\uce20 {value0} \ubcf4\uae30',
    ariaLabel: '\ucf54\uc2a4 \uc9c0\ub3c4',
    loadingTitle: '\uc9c0\ub3c4\ub97c \ubd88\ub7ec\uc624\ub294 \uc911',
    missingKeyTitle: '\uce74\uce74\uc624\ub9f5',
    missingKeyText: ' \ud0a4\ub97c \uc124\uc815\ud558\uba74 \uc9c0\ub3c4\uac00 \ud45c\uc2dc\ub429\ub2c8\ub2e4.',
    emptyTitle: '\uc9c0\ub3c4\uc5d0 \ud45c\uc2dc\ud560 \uc7a5\uc18c\uac00 \uc5c6\uc2b5\ub2c8\ub2e4',
    emptyTextWithCount: '\uc88c\ud45c\uac00 \uc788\ub294 \uc7a5\uc18c\uac00 \uc5c6\uc2b5\ub2c8\ub2e4. \uc804\uccb4 {count}\uac1c \uc7a5\uc18c \uc911 \uc9c0\ub3c4\uc5d0 \ud45c\uc2dc\ud560 \uc218 \uc788\ub294 \uc7a5\uc18c\ub97c \ucc3e\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4.',
    emptyText: '\uc88c\ud45c\uac00 \uc788\ub294 \uc7a5\uc18c\ub97c \uc120\ud0dd\ud558\uba74 \uc9c0\ub3c4\uc5d0 \ud45c\uc2dc\ub429\ub2c8\ub2e4.',
    errorTitle: '\uc9c0\ub3c4\ub97c \ubd88\ub7ec\uc624\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4',
    errorText: '\uc7a0\uc2dc \ud6c4 \ub2e4\uc2dc \uc2dc\ub3c4\ud574 \uc8fc\uc138\uc694.',
    placeDetailAction: '\uc7a5\uc18c \uc0c1\uc138\ubcf4\uae30',
  },
  en: {
    countWithTotal: '{value0} of {value1} places mapped',
    count: '{value0} places mapped',
    placeFallback: 'Place information',
    closePlaceDetails: 'Close place details',
    openInKakaoMap: 'Open in Kakao Map',
    relatedContent: 'Related content',
    viewRelatedContent: 'View related content {value0}',
    ariaLabel: 'Course map',
    loadingTitle: 'Loading map',
    missingKeyTitle: 'Kakao Map',
    missingKeyText: ' key is required to show the map.',
    emptyTitle: 'No places to show on the map',
    emptyTextWithCount: 'No places with coordinates were found among {count} places.',
    emptyText: 'Select places with coordinates to show them on the map.',
    errorTitle: 'Could not load map',
    errorText: 'Try again in a moment.',
    placeDetailAction: 'View place details',
  },
  ja: {
    countWithTotal: '{value0} / {value1}件の場所を地図に表示',
    count: '{value0}件の場所を地図に表示',
    placeFallback: '場所情報',
    closePlaceDetails: '場所の詳細を閉じる',
    openInKakaoMap: 'Kakao Mapで開く',
    relatedContent: '関連コンテンツ',
    viewRelatedContent: '関連コンテンツ {value0} を見る',
    ariaLabel: 'コース地図',
    loadingTitle: '地図を読み込み中',
    missingKeyTitle: 'Kakao Map',
    missingKeyText: 'キーを設定すると地図が表示されます。',
    emptyTitle: '地図に表示する場所がありません',
    emptyTextWithCount: '全{count}件のうち、座標のある場所が見つかりませんでした。',
    emptyText: '座標のある場所を選択すると地図に表示されます。',
    errorTitle: '地図を読み込めませんでした',
    errorText: 'しばらくしてからもう一度お試しください。',
    placeDetailAction: '場所の詳細を見る',
  },
  'zh-CN': {
    countWithTotal: '地图显示 {value0} / {value1} 个地点',
    count: '地图显示 {value0} 个地点',
    placeFallback: '地点信息',
    closePlaceDetails: '关闭地点详情',
    openInKakaoMap: '在 Kakao Map 中打开',
    relatedContent: '相关内容',
    viewRelatedContent: '查看相关内容 {value0}',
    ariaLabel: '路线地图',
    loadingTitle: '正在加载地图',
    missingKeyTitle: 'Kakao Map',
    missingKeyText: '密钥设置后即可显示地图。',
    emptyTitle: '地图上没有可显示的地点',
    emptyTextWithCount: '在 {count} 个地点中未找到带坐标的地点。',
    emptyText: '选择带坐标的地点后即可显示在地图上。',
    errorTitle: '无法加载地图',
    errorText: '请稍后重试。',
    placeDetailAction: '查看地点详情',
  },
};
const MAP_LABEL_KEYS = {
  countWithTotal: 'map.preview.countWithTotal',
  count: 'map.preview.count',
  placeFallback: 'map.preview.placeFallback',
  closePlaceDetails: 'map.preview.closePlaceDetails',
  openInKakaoMap: 'map.preview.openInKakaoMap',
  relatedContent: 'map.preview.relatedContent',
  viewRelatedContent: 'map.preview.viewRelatedContent',
  ariaLabel: 'map.preview.ariaLabel',
  loadingTitle: 'map.preview.loadingTitle',
  missingKeyTitle: 'map.preview.missingKeyTitle',
  missingKeyText: 'map.preview.missingKeyText',
  emptyTitle: 'map.preview.emptyTitle',
  emptyTextWithCount: 'map.preview.emptyTextWithCount',
  emptyText: 'map.preview.emptyText',
  errorTitle: 'map.preview.errorTitle',
  errorText: 'map.preview.errorText',
  placeDetailAction: 'map.placeDetailAction',
};
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
  ? mapLabel('countWithTotal', { value0: validPlaces.value.length, value1: totalPlaceCount.value })
  : mapLabel('count', { value0: validPlaces.value.length })));
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
  return localized.placeName || localized.name || mapLabel('placeFallback');
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

function formatLabel(template, params = {}) {
  return String(template ?? '').replace(/\{(\w+)\}/g, (match, key) => (
    Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : match
  ));
}

function isBrokenUiLabel(value, key) {
  const text = String(value ?? '').trim();
  return !text || text === key || /^\?+$/.test(text) || /\?{2,}|\uFFFD/.test(text);
}

function mapLabel(name, params = {}) {
  const key = MAP_LABEL_KEYS[name];
  const normalized = normalizeLocale(locale.value) || 'ko';
  const translated = key ? t(key, params) : '';
  if (!isBrokenUiLabel(translated, key)) return translated;
  const fallback = MAP_LABEL_FALLBACKS[normalized]?.[name] ?? MAP_LABEL_FALLBACKS.ko[name] ?? '';
  if (import.meta.env.DEV && key) {
    console.warn(`[i18n] Falling back for ${key}`);
  }
  return formatLabel(fallback, params);
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
  closeButton.setAttribute('aria-label', mapLabel('closePlaceDetails'));
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
  kakaoLink?.setAttribute('aria-label', mapLabel('openInKakaoMap'));
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
    relatedScroller.setAttribute('aria-label', mapLabel('relatedContent'));
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
      relatedButton?.setAttribute('aria-label', mapLabel('viewRelatedContent', { value0: contentItem.title }));
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
    <div ref="mapContainer" class="kakao-map" role="img" :aria-label="mapLabel('ariaLabel')"></div>
    <div v-if="mapStatus !== 'ready'" class="map-status" role="status">
      <strong v-if="mapStatus === 'loading'">{{ mapLabel('loadingTitle') }}</strong>
      <template v-else-if="mapStatus === 'missing-key'">
        <strong>{{ mapLabel('missingKeyTitle') }}</strong>
        <span><code>VITE_KAKAO_MAP_JAVASCRIPT_KEY</code>{{ mapLabel('missingKeyText') }}</span>
      </template>
      <template v-else-if="mapStatus === 'empty'">
        <strong>{{ mapLabel('emptyTitle') }}</strong>
        <span v-if="totalPlaceCount">{{ mapLabel('emptyTextWithCount', { count: totalPlaceCount }) }}</span>
        <span v-else>{{ mapLabel('emptyText') }}</span>
      </template>
      <template v-else>
        <strong>{{ mapLabel('errorTitle') }}</strong>
        <span>{{ mapLabel('errorText') }}</span>
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
      <small>{{ mapLabel('placeDetailAction') }}</small>
    </button>
    <span v-if="mapStatus === 'ready' && !infoOpen" class="map-label">{{ mapCountLabel }}</span>
  </div>
</template>
