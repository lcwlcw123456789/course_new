<template>
  <div class="chart-container" ref="wrapperRef">
    <!-- 图像区域 -->
    <div :class="['chart-box', { visible: animationTrigger }]" ref="chartRef">
      <p v-if="!spec">点击图表加载中...</p>
    </div>

    <!-- 控件区域 -->
    <div
      :class="['vega-controls', { visible: animationTrigger }]"
      ref="controlRef"
    />

    <!-- 关闭按钮 -->
    <button class="close-btn" @click="handleClose">🏠</button>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import * as vegaEmbed from "vega-embed";

const props = defineProps({ spec: Object, componentNumber: Number });
const emit = defineEmits(["close"]);

const chartRef = ref(null);
const wrapperRef = ref(null);
const controlRef = ref(null);

const ready = ref(false); // 控制是否渲染 DOM
const animationTrigger = ref(false); // 控制动画触发

let resizeObserver;

const renderChart = async (width, height) => {
  if (!props.spec || !chartRef.value) return;

  // 1. 立即隐藏动画
  animationTrigger.value = false;
  ready.value = false;

  await nextTick();

  const cleanSpec = JSON.parse(JSON.stringify(props.spec));
  cleanSpec.width = width;
  cleanSpec.height = height - 50;

  const scaleFactor = Math.min(width, height) / 2.2;
  if (Array.isArray(cleanSpec.projections)) {
    const proj = cleanSpec.projections.find((p) => p.name === "projection");
    if (proj) proj.scale = scaleFactor;
  }

  chartRef.value.innerHTML = "";
  controlRef.value.innerHTML = "";

  const result = await vegaEmbed.default(chartRef.value, cleanSpec, {
    actions: false,
    renderer: "svg",
  });

  const form = chartRef.value.querySelector(".vega-bindings");
  if (form) {
    controlRef.value.appendChild(form);
  }

  // 2. 显示组件 + 动画过渡
  ready.value = true;
  await nextTick(); // 等 DOM 挂载完毕再开始动画
  animationTrigger.value = true;
};

const resize = () => {
  if (!chartRef.value || !wrapperRef.value) return;
  const { width, height } = chartRef.value.getBoundingClientRect();
  renderChart(Math.floor(width), Math.floor(height));
};

const handleClose = () => {
  emit("close");
};

watch(
  () => props.spec,
  () => resize(),
  { immediate: true }
);

onMounted(() => {
  if (props.spec) resize();
  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(chartRef.value);
});

onBeforeUnmount(() => {
  if (resizeObserver && chartRef.value)
    resizeObserver.unobserve(chartRef.value);
});
</script>

<style scoped>
.chart-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.chart-box {
  flex: 1;
  background-color: #ffe4b5;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #aaa;
  font-size: 1.5rem;
  box-sizing: border-box;
  overflow: hidden;

  opacity: 0;
  transition: opacity 0.5s ease;
}

.chart-box.visible {
  opacity: 1;
}

.vega-controls {
  padding: 8px 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  background-color: #fff8dc;
  border-top: 1px solid #ccc;

  opacity: 0;
  transition: opacity 0.5s ease;
}

.vega-controls.visible {
  opacity: 1;
}

.vega-bindings {
  font-family: monospace;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.vega-bind {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 150px;
  white-space: nowrap;
}

.vega-bind span:last-child {
  display: inline-block;
  width: 36px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 30px;
  font-size: 14px;
  background: linear-gradient(to right, #4facfe, #00f2fe);
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

.close-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.25);
  background: linear-gradient(to right, #43e97b, #38f9d7);
}
</style>
