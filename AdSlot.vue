<template>
  <div
    class="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 rounded-2xl p-4 transition-colors select-none group"
    :class="computedClasses"
    :style="computedStyle"
  >
    <div class="flex items-center gap-2 text-slate-400 dark:text-slate-500">
      <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
      <span class="text-xs font-mono uppercase tracking-wider font-semibold">{{ label }}</span>
    </div>
    <p class="text-[10px] text-slate-400/80 mt-1">Партнерский рекламный блок (Формат: {{ size }})</p>
  </div>
</template>

<script>
export default {
  name: 'AdSlot',
  props: {
    size: {
      type: String,
      default: 'banner',
      validator: (val) => ['banner', 'sidebar', 'rectangle', 'custom'].includes(val)
    },
    width: {
      type: String,
      default: ''
    },
    height: {
      type: String,
      default: ''
    },
    label: {
      type: String,
      default: 'Рекламное место'
    }
  },
  computed: {
    computedClasses() {
      if (this.size === 'banner') return 'w-full h-24 sm:h-28';
      if (this.size === 'sidebar') return 'w-full h-64';
      if (this.size === 'rectangle') return 'w-72 sm:w-80 h-60';
      return '';
    },
    computedStyle() {
      const style = {};
      if (this.width) style.width = this.width;
      if (this.height) style.height = this.height;
      return style;
    }
  }
};
</script>
