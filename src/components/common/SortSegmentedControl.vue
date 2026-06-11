<script setup>
defineOptions({
  name: 'SortSegmentedControl',
});

const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
  options: {
    type: Array,
    required: true,
  },
  ariaLabel: {
    type: String,
    default: '정렬 선택',
  },
});

const emit = defineEmits(['update:modelValue']);

function choose(value) {
  if (value !== props.modelValue) {
    emit('update:modelValue', value);
  }
}

function chooseByOffset(offset) {
  const optionCount = props.options.length;
  if (!optionCount) return;

  const currentIndex = Math.max(
    0,
    props.options.findIndex((option) => option.value === props.modelValue),
  );
  const nextOption = props.options[(currentIndex + offset + optionCount) % optionCount];
  choose(nextOption.value);
}
</script>

<template>
  <div
    class="segmented-sort"
    role="radiogroup"
    :aria-label="props.ariaLabel"
    :style="{ '--segmented-option-count': props.options.length }"
  >
    <button
      v-for="option in props.options"
      :key="option.value"
      type="button"
      class="segmented-sort__option"
      :class="{ active: option.value === props.modelValue }"
      role="radio"
      :aria-checked="option.value === props.modelValue"
      @click="choose(option.value)"
      @keydown.left.prevent="chooseByOffset(-1)"
      @keydown.up.prevent="chooseByOffset(-1)"
      @keydown.right.prevent="chooseByOffset(1)"
      @keydown.down.prevent="chooseByOffset(1)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
