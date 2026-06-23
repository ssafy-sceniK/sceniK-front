<script setup>
defineProps({
  items: { type: Array, required: true },
  modelValue: { type: [String, Number], default: '' },
});

const emit = defineEmits(['update:modelValue']);

function itemValue(item) {
  return item && typeof item === 'object' ? item.value : item;
}

function itemLabel(item) {
  if (!item || typeof item !== 'object') return item;
  return item.label ?? item.value;
}
</script>

<template>
  <div class="chip-row">
    <button
      v-for="item in items"
      :key="itemValue(item)"
      class="chip"
      :class="{ selected: itemValue(item) === modelValue }"
      type="button"
      @click="emit('update:modelValue', itemValue(item))"
    >
      {{ itemLabel(item) }}
    </button>
  </div>
</template>
