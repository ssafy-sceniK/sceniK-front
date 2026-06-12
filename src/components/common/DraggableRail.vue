<script setup>
import { ref } from 'vue';

const dragState = ref({
  active: false,
  moved: false,
  pointerId: null,
  scrollLeft: 0,
  startX: 0,
  suppressClick: false,
});

function startDrag(event) {
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  const rail = event.currentTarget;
  dragState.value = {
    active: true,
    moved: false,
    pointerId: event.pointerId,
    scrollLeft: rail.scrollLeft,
    startX: event.clientX,
    suppressClick: false,
  };
}

function moveDrag(event) {
  const state = dragState.value;
  if (!state.active) return;

  const rail = event.currentTarget;
  const deltaX = event.clientX - state.startX;
  if (Math.abs(deltaX) > 5) {
    state.moved = true;
    if (!rail.hasPointerCapture?.(event.pointerId)) {
      rail.setPointerCapture?.(event.pointerId);
    }
    rail.scrollLeft = state.scrollLeft - deltaX;
    event.preventDefault();
  }
}

function endDrag(event) {
  const state = dragState.value;
  if (!state.active) return;

  if (event.currentTarget.hasPointerCapture?.(state.pointerId)) {
    event.currentTarget.releasePointerCapture(state.pointerId);
  }
  dragState.value = {
    ...state,
    active: false,
    suppressClick: state.moved,
  };

  if (state.moved) {
    window.setTimeout(() => {
      dragState.value = { ...dragState.value, suppressClick: false };
    }, 120);
  }
}

function preventDraggedClick(event) {
  if (!dragState.value.suppressClick) return;
  event.preventDefault();
  event.stopPropagation();
  dragState.value = { ...dragState.value, suppressClick: false };
}
</script>

<template>
  <div
    class="rail draggable-rail"
    :class="{ 'is-dragging': dragState.moved }"
    @click.capture="preventDraggedClick"
    @pointerdown="startDrag"
    @pointermove="moveDrag"
    @pointerup="endDrag"
    @pointercancel="endDrag"
    @pointerleave="endDrag"
  >
    <slot />
  </div>
</template>
