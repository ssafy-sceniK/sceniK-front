<script setup>
defineProps({
  items: { type: Array, required: true },
  modelValue: { type: [String, Number], default: '' },
});

const emit = defineEmits(['update:modelValue']);
</script>

<template>
  <div class="chip-row">
    <button
      v-for="item in items"
      :key="item"
      class="chip"
      :class="{ selected: item === modelValue }"
      type="button"
      @click="emit('update:modelValue', item)"
    >
      {{ item }}
    </button>
  </div>
</template>
