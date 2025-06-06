<template>
  <div class="chart-container" ref="wrapperRef">
    <div class="chart-box" ref="chartRef">
      <p v-if="!spec">点击图表加载中...</p>
    </div>
    <button class="close-btn" @click="handleClose">🏠</button>
    <button class="lock-btn" @click="toggleLock">
      {{ isLocked ? "🔒" : "🔓" }}
    </button>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import * as vegaEmbed from "vega-embed";

defineOptions({ name: "PieChart" });

const props = defineProps({ spec: Object, componentNumber: Number });
const emit = defineEmits(["close"]);

const chartRef = ref(null);
const wrapperRef = ref(null);
const isLocked = ref(false);
let resizeObserver;

const renderChart = async (width, height) => {
  if (props.spec && chartRef.value) {
    await nextTick();
    const cleanSpec = JSON.parse(JSON.stringify(props.spec));
    await vegaEmbed.default(chartRef.value, cleanSpec, {
      actions: false,
      width,
      height,
    });
  }
};

const resize = () => {
  if (!chartRef.value || !wrapperRef.value) return;
  const { width, height } = wrapperRef.value.getBoundingClientRect();
  renderChart(Math.floor(width) * 0.6, Math.floor(height) * 0.6);
};

watch(
  () => props.spec,
  () => {
    if (!isLocked.value) {
      resize();
    } else {
      console.log("⛔ Chart update ignored (locked)");
    }
  },
  { immediate: true }
);

onMounted(() => {
  if (props.spec) resize();
  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(wrapperRef.value);
});

onBeforeUnmount(() => {
  if (resizeObserver && wrapperRef.value)
    resizeObserver.unobserve(wrapperRef.value);
});

const handleClose = () => emit("close");
const toggleLock = () => (isLocked.value = !isLocked.value);
</script>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.chart-box {
  width: 100%;
  height: 100%;
  background-color: #ffe4b5;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #aaa;
  font-size: 1.5rem;
  box-sizing: border-box;
}

.close-btn,
.lock-btn {
  position: absolute;
  top: 20px;
  font-size: 14px;
  color: white;
  padding: 8px 16px;
  border-radius: 30px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.close-btn {
  right: 30px;
  background: linear-gradient(to right, #4facfe, #00f2fe);
}

.lock-btn {
  right: 130px;
  background: linear-gradient(to right, #ff758c, #ff7eb3);
}

.close-btn:hover {
  transform: translateY(-2px);
  background: linear-gradient(to right, #43e97b, #38f9d7);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.25);
}

.lock-btn:hover {
  transform: translateY(-2px);
  background: linear-gradient(to right, #f77062, #fe5196);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.25);
}
</style>
