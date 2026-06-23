<script setup>
import { motion } from 'motion-v';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import planeIcon from '../../assets/brand/plane-icon.png';

const reduce =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const ease = [0.22, 1, 0.36, 1];
const flightPath = 'M 18 112 C 40 108, 62 83, 84 52 C 108 19, 140 19, 174 2';
const flightDelayMs = 120;
const trailDurationMs = 2900;
const flightDurationMs = 1600;
const motionPath = ref(null);
const flightTransform = ref('translate(18 112) rotate(92)');
const flightOpacity = ref(0);
let animationFrameId;

const wordmark = reduce
  ? { initial: false, animate: { opacity: 1, y: 0 } }
  : {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.48, ease, delay: 0.06 },
    };

function cubicBezierEase(time) {
  const x1 = 0.22;
  const y1 = 0.86;
  const x2 = 0.36;
  const y2 = 1;
  let t = time;

  for (let iteration = 0; iteration < 6; iteration += 1) {
    const inverseT = 1 - t;
    const x = 3 * inverseT * inverseT * t * x1 + 3 * inverseT * t * t * x2 + t * t * t;
    const derivative =
      3 * inverseT * inverseT * x1 +
      6 * inverseT * t * (x2 - x1) +
      3 * t * t * (1 - x2);

    if (Math.abs(derivative) < 0.0001) break;
    t = Math.min(1, Math.max(0, t - (x - time) / derivative));
  }

  const inverseT = 1 - t;
  return 3 * inverseT * inverseT * t * y1 + 3 * inverseT * t * t * y2 + t * t * t;
}

onMounted(() => {
  if (reduce || !motionPath.value) return;

  const pathLength = motionPath.value.getTotalLength();
  let startTime;

  const animateFlight = (timestamp) => {
    startTime ??= timestamp;
    const elapsed = timestamp - startTime;

    if (elapsed < flightDelayMs) {
      animationFrameId = requestAnimationFrame(animateFlight);
      return;
    }

    const progress = Math.min((elapsed - flightDelayMs) / flightDurationMs, 1);
    const pathProgress = cubicBezierEase(progress);
    const position = motionPath.value.getPointAtLength(pathLength * pathProgress);
    const angle = 17;

    flightTransform.value = `translate(${position.x} ${position.y}) rotate(${angle})`;
    flightOpacity.value = Math.min((elapsed - flightDelayMs) / 120, 1);

    if (progress < 1) animationFrameId = requestAnimationFrame(animateFlight);
  };

  animationFrameId = requestAnimationFrame(animateFlight);
});

onBeforeUnmount(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
});

</script>

<template>
  <svg
    class="splash-brandmark"
    viewBox="0 0 520 175"
    role="img"
    aria-label="sceniK"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <mask id="scenik-trail-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="140" height="140">
        <path
          class="splash-brandmark__trail-reveal"
          :d="flightPath"
          pathLength="1"
          :stroke-dashoffset="reduce ? 0 : 1"
        >
          <animate
            v-if="!reduce"
            attributeName="stroke-dashoffset"
            :begin="`${flightDelayMs}ms`"
            :dur="`${trailDurationMs}ms`"
            from="1"
            to="0"
            calcMode="spline"
            keyTimes="0; 1"
            keySplines="0.22 0.86 0.36 1"
            fill="freeze"
          />
        </path>
      </mask>
      <mask id="scenik-plane-mask" maskUnits="userSpaceOnUse" x="-41" y="-41" width="82" height="82" mask-type="alpha">
        <image :href="planeIcon" x="-41" y="-41" width="82" height="82" filter="url(#scenik-plane-outline)" />
      </mask>
      <filter id="scenik-plane-outline" x="-10%" y="-10%" width="120%" height="120%">
        <feMorphology in="SourceAlpha" operator="dilate" radius="0.8" />
      </filter>
    </defs>

    <motion.text class="splash-brandmark__word" x="2" y="122" v-bind="wordmark">sceniK</motion.text>

    <g transform="translate(292, 8)">
      <path class="splash-brandmark__trail" :d="flightPath" mask="url(#scenik-trail-mask)" />
      <path ref="motionPath" class="splash-brandmark__motion-guide" :d="flightPath" />

      <g
        v-if="reduce"
        class="splash-brandmark__flight"
        transform="translate(174 2) rotate(5)"
        style="opacity: 1"
      >
        <rect class="splash-brandmark__plane" x="-41" y="-41" width="82" height="82" mask="url(#scenik-plane-mask)" />
      </g>
      <g v-else class="splash-brandmark__flight" :transform="flightTransform" :style="{ opacity: flightOpacity }">
        <rect class="splash-brandmark__plane" x="-41" y="-41" width="82" height="82" mask="url(#scenik-plane-mask)" />
      </g>
    </g>
  </svg>
</template>

<style scoped>
.splash-brandmark {
  display: block;
  width: 100%;
  max-width: 300px;
  height: auto;
  margin: 0 auto;
  overflow: visible;
}

.splash-brandmark__word {
  font-family: 'Dit Magi', Georgia, 'Times New Roman', serif;
  font-size: 132px;
  fill: #2563eb;
  stroke: #2563eb;
  stroke-width: 3.4px;
  stroke-linejoin: round;
  paint-order: stroke fill;
  letter-spacing: -1px;
}

.splash-brandmark__trail {
  fill: none;
  stroke: #2563eb;
  stroke-width: 4.5;
  stroke-linecap: round;
  stroke-dasharray: 0.1 17;
}

.splash-brandmark__trail-reveal {
  fill: none;
  stroke: #fff;
  stroke-width: 14;
  stroke-linecap: round;
  stroke-dasharray: 1;
}

.splash-brandmark__motion-guide {
  fill: none;
  stroke: none;
}

.splash-brandmark__flight {
  opacity: 0;
  will-change: transform, opacity;
  transform-box: fill-box;
  transform-origin: center;
  backface-visibility: hidden;
}

.splash-brandmark__plane {
  fill: #2563eb;
}
</style>
