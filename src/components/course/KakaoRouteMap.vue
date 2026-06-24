<script setup>
import { useI18n } from 'vue-i18n';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { loadKakaoMaps } from '../../utils/kakaoMaps.js';

const { t } = useI18n();

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
let infoOverlay;
let themeObserver;

const appKey = import.meta.env.VITE_KAKAO_MAP_APP_KEY || import.meta.env.VITE_KAKAO_MAP_JAVASCRIPT_KEY;
const mapStops = computed(() => props.stops.filter((stop) => (
  isSelectedRegionPlace(stop)
  && Number.isFinite(Number(stop.latitude))
  && Number.isFinite(Number(stop.longitude))
)));
const hasHiddenStops = computed(() => props.stops.length > mapStops.value.length);

function normalizeRegion(value) {
  const normalized = String(value ?? '').replace(/\s+/g, '');
  if (normalized.startsWith('\uc11c\uc6b8')) return '\uc11c\uc6b8';
  if (normalized.startsWith('\ubd80\uc0b0')) return '\ubd80\uc0b0';
  if (normalized.startsWith('\uc778\ucc9c')) return '\uc778\ucc9c';
  if (normalized.startsWith('\ub300\uad6c')) return '\ub300\uad6c';
  if (normalized.startsWith('\ub300\uc804')) return '\ub300\uc804';
  if (normalized.startsWith('\uad11\uc8fc')) return '\uad11\uc8fc';
  if (normalized.startsWith('\uc6b8\uc0b0')) return '\uc6b8\uc0b0';
  if (normalized.startsWith('\uc138\uc885')) return '\uc138\uc885';
  if (normalized.startsWith('\uacbd\uae30')) return '\uacbd\uae30';
  if (normalized.startsWith('\uac15\uc6d0')) return '\uac15\uc6d0';
  if (normalized.startsWith('\ucda9\ubd81') || normalized.startsWith('\ucda9\uccad\ubd81\ub3c4')) return '\ucda9\ubd81';
  if (normalized.startsWith('\ucda9\ub0a8') || normalized.startsWith('\ucda9\uccad\ub0a8\ub3c4')) return '\ucda9\ub0a8';
  if (normalized.startsWith('\uc804\ubd81') || normalized.startsWith('\uc804\ub77c\ubd81\ub3c4')) return '\uc804\ubd81';
  if (normalized.startsWith('\uc804\ub0a8') || normalized.startsWith('\uc804\ub77c\ub0a8\ub3c4')) return '\uc804\ub0a8';
  if (normalized.startsWith('\uacbd\ubd81') || normalized.startsWith('\uacbd\uc0c1\ubd81\ub3c4')) return '\uacbd\ubd81';
  if (normalized.startsWith('\uacbd\ub0a8') || normalized.startsWith('\uacbd\uc0c1\ub0a8\ub3c4')) return '\uacbd\ub0a8';
  if (normalized.startsWith('\uc81c\uc8fc')) return '\uc81c\uc8fc';
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

function closeInfoOverlay() {
  infoOverlay?.setMap(null);
  infoOverlay = null;
}

function placeName(stop) {
  return stop.placeName ?? stop.name ?? t('autoPass.ui_6efb3787d7');
}

function createStopInfo(stop) {
  const content = document.createElement('article');
  content.className = 'route-stop-info';
  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'route-stop-info__close';
  closeButton.textContent = '×';
  closeButton.setAttribute('aria-label', t('autoPass.ui_306e06b238'));
  closeButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    closeInfoOverlay();
  });
  const title = document.createElement('strong');
  title.textContent = placeName(stop);
  const meta = document.createElement('span');
  meta.textContent = [stop.region, stop.category].filter(Boolean).join(' · ');
  const address = document.createElement('small');
  address.textContent = stop.address ?? '';
  content.append(closeButton, title, meta, address);
  return content;
}

function openStopInfo(kakaoMaps, marker, stop) {
  closeInfoOverlay();
  infoOverlay = new kakaoMaps.CustomOverlay({
    map,
    position: marker.getPosition(),
    content: createStopInfo(stop),
    clickable: true,
    xAnchor: 0.5,
    yAnchor: 1.08,
    zIndex: 10,
  });
}

function routeStrokeColor() {
  if (typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark') return '#ef4444';
  return '#1455ff';
}

function clearMapObjects() {
  closeInfoOverlay();
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
    statusMessage.value = t('autoPass.ui_bd7f476fcf');
    return;
  }
  if (!mapStops.value.length) {
    statusMessage.value = t('autoPass.ui_93eb87ab9d');
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
        title: placeName(stop),
      });
      kakaoMaps.event.addListener(marker, 'click', () => openStopInfo(kakaoMaps, marker, stop));
      markers.push(marker);
      return position;
    });

    if (path.length > 1) {
      polyline = new kakaoMaps.Polyline({
        map,
        path,
        strokeWeight: 4,
        strokeColor: routeStrokeColor(),
        strokeOpacity: 0.8,
        strokeStyle: 'solid',
      });
    }

    map.setBounds(bounds);
    statusMessage.value = hasHiddenStops.value ? t('autoPass.ui_93eb87ab9d') : '';
  } catch (error) {
    console.warn('Kakao route map render failed', error);
    statusMessage.value = t('autoPass.ui_2d729d0faa');
  }
}

watch(() => [props.stops, props.region, props.regions], renderMap, { deep: true });

onMounted(() => {
  void renderMap();
  if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
    themeObserver = new MutationObserver(() => { void renderMap(); });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }
});

onBeforeUnmount(() => {
  themeObserver?.disconnect();
  clearMapObjects();
});
</script>

<template>
  <div class="kakao-route-map">
    <div ref="mapElement" class="kakao-route-map__canvas"></div>
    <p v-if="statusMessage" class="kakao-route-map__notice">{{ statusMessage }}</p>
  </div>
</template>
