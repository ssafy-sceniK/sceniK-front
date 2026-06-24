<script setup>
import { computed } from 'vue';
import { motion } from 'motion-v';
import { useI18n } from 'vue-i18n';
import planeIcon from '../../assets/brand/plane-icon.png';

defineOptions({ name: 'AiRunwayProgress' });

const { t } = useI18n();

const props = defineProps({
  progress: { type: Number, required: true },
  theme: {
    type: String,
    default: 'dark',
    validator: (value) => ['dark', 'light'].includes(value),
  },
});

const safeProgress = computed(() => Math.min(100, Math.max(0, props.progress)));
const circumference = 2 * Math.PI * 92;
const progressOffset = computed(() => circumference * (1 - safeProgress.value / 100));

// 0% starts at 12 o'clock. The tangent rotation keeps the aircraft facing its flight direction.
const planePosition = computed(() => {
  const angle = safeProgress.value * 3.6 - 90;
  const radians = (angle * Math.PI) / 180;
  const radius = 92;
  return {
    x: 120 + Math.cos(radians) * radius,
    y: 120 + Math.sin(radians) * radius,
    rotation: angle + 90,
  };
});
</script>

<template>
  <div class="runway-progress" :class="`runway-progress--${props.theme}`" :style="{ '--plane-icon': `url(${planeIcon})` }" role="progressbar" :aria-label="t('aiCourse.loading.progressAria')" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="safeProgress">
    <svg class="runway-progress__track" viewBox="0 0 240 240" aria-hidden="true">
      <circle class="runway-progress__inactive" cx="120" cy="120" r="92" />
      <motion.circle class="runway-progress__active" cx="120" cy="120" r="92" :animate="{ strokeDashoffset: progressOffset }" :transition="{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }" />
      <circle class="runway-progress__dash" cx="120" cy="120" r="76" />
    </svg>

    <div class="runway-progress__plane-anchor" aria-hidden="true">
      <motion.div class="runway-progress__plane" :animate="{ x: planePosition.x - 120, y: planePosition.y - 120, rotate: planePosition.rotation }" :transition="{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }" />
    </div>

    <div class="runway-progress__value">
      <strong>{{ safeProgress }}<small>%</small></strong>
      <span>ROUTE READY</span>
    </div>
  </div>
</template>

<style scoped>
.runway-progress { --progress-active: #ef4444; --progress-inactive: rgba(255,255,255,.18); --runway-dash: rgba(255,255,255,.38); --value-text: #fff; --value-subtext: #d1d5db; --plane-color: #fff; --plane-size: 60px; position: relative; width: min(100%, 240px); aspect-ratio: 1; margin: 0 auto; }
.runway-progress--light { --progress-active: #2563eb; --progress-inactive: #e5e7eb; --runway-dash: #cbd5e1; --value-text: #111827; --value-subtext: #6b7280; --plane-color: #111827; --plane-size: 50px; }
.runway-progress__track { width: 100%; height: 100%; overflow: visible; transform: rotate(-90deg); }
.runway-progress__inactive, .runway-progress__active, .runway-progress__dash { fill: none; transform-origin: center; }
.runway-progress__inactive, .runway-progress__active { stroke-width: 12; }
.runway-progress__inactive { stroke: var(--progress-inactive); }
.runway-progress__active { stroke: var(--progress-active); stroke-linecap: round; stroke-dasharray: 578.05; }
.runway-progress__dash { stroke: var(--runway-dash); stroke-width: 1.5; stroke-dasharray: 3 8; }
.runway-progress__plane-anchor { position: absolute; top: 50%; left: 50%; width: 0; height: 0; transform: translate(-50%, -50%); }
.runway-progress__plane { width: var(--plane-size); height: var(--plane-size); margin: calc(var(--plane-size) / -2); background: var(--plane-color); mask: var(--plane-icon) center / contain no-repeat; -webkit-mask: var(--plane-icon) center / contain no-repeat; filter: drop-shadow(0 3px 5px rgba(0,0,0,.28)); }
.runway-progress__value { position: absolute; inset: 0; display: grid; place-content: center; text-align: center; }
.runway-progress__value strong { color: var(--value-text); font-size: 43px; font-weight: 900; letter-spacing: -0.07em; line-height: 1; }
.runway-progress__value small { margin-left: 2px; color: var(--progress-active); font-size: 20px; letter-spacing: -0.03em; }
.runway-progress__value span { margin-top: 8px; color: var(--value-subtext); font-size: 9px; font-weight: 800; letter-spacing: 0.14em; }
</style>
