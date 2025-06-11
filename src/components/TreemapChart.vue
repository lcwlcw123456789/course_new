<template>
  <div
    :key="forceRebuildKey"
    :class="['chart-container', { zoomed: isZoomed, visible: ready }]"
  >
    <h2 class="title">
      <button class="zoom-btn" @click="toggleZoom">
        {{ isZoomed ? "🔍➖" : "🔍➕" }}
      </button>
      <span v-if="props.meta?.year"> 📅 Year: {{ props.meta.year }} </span>
    </h2>

    <!-- 等待完全渲染后再显示图表与控件 -->
    <div v-show="ready" class="chart-box" ref="chartRef">
      <p v-if="!spec">点击图表加载中...</p>
    </div>

    <!-- 控件区域 -->
    <div v-show="ready" class="vega-controls no-drag" ref="controlRef" />

    <!-- 关闭按钮 -->
    <button class="close-btn" @click="handleClose">❌</button>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from "vue";
import * as vegaEmbed from "vega-embed";

const props = defineProps({
  spec: Object,
  meta: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(["close"]);
const chartRef = ref(null);

const controlRef = ref(null);

const ready = ref(false); // 控制显示与否
const isZoomed = ref(false);
const forceRebuildKey = ref(0);

const toggleZoom = async () => {
  isZoomed.value = !isZoomed.value;

  await nextTick(); // 等待 DOM 更新后再执行渲染
  await renderChart(); // 重新渲染 Vega 图
};

const renderChart = async () => {
  if (props.spec && chartRef.value) {
    ready.value = false; // 暂时隐藏图表和控件
    chartRef.value.innerHTML = ""; // 清空图表
    controlRef.value.innerHTML = ""; // 清空控件！！！

    await nextTick();
    const cleanSpec = JSON.parse(JSON.stringify(props.spec));
    cleanSpec.autosize = {
      type: "fit",
      resize: "true",
    };

    await vegaEmbed.default(chartRef.value, cleanSpec, { actions: false });

    // 控件渲染后，立即移动到指定区域
    const form = chartRef.value.querySelector(".vega-bindings");
    if (form) {
      controlRef.value.appendChild(form);
    }

    // 一切完成后，再显示 chartBox 和控件
    ready.value = true;
  }
};

const handleClose = () => {
  emit("close");
};

watch(
  () => props.spec,
  () => renderChart(),
  { immediate: true }
);

onMounted(() => {
  if (props.spec) {
    setTimeout(() => {
      renderChart();
    }, 10); // 触发初始 opacity: 0 → 1 过渡
  }
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

  opacity: 0;
  transition: opacity 0.4s ease;
}

.chart-container.visible {
  opacity: 1;
}

.chart-container.zoomed {
  position: fixed;
  top: 5%;
  left: 5%;
  width: 90vw;
  height: 90vh;
  background-color: white;
  z-index: 999;
  border-radius: 10px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.25);
  padding: 10px;
}

.zoom-btn {
  margin-right: 12px;
  font-size: 14px;
  background: linear-gradient(to right, #ff9966, #ff5e62);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  border: none;
}

.zoom-btn:hover {
  background: linear-gradient(to right, #ff512f, #dd2476);
}

.chart-box {
  flex: 1;
  background-color: #ffffff;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #aaa;
  font-size: 1.5rem;
  box-sizing: border-box;
  overflow: hidden;
}

/* 控件容器 */
.vega-controls {
  flex: 0 0 auto;
  padding: 8px 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  background-color: #ffffff;
  border-top: 1px solid #ccc;
}

/* 控件美化与防抖动 */
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

/* 关闭按钮样式 */
.close-btn {
  position: absolute;
  top: 10px;
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

.title {
  flex: 0 0 40px;
  font-size: 20px;
  font-weight: bold;
  margin: 0;
  padding: 8px 16px;
  color: #000000;
  background-color: #ffffff;
  display: flex;
  align-items: center;
}
</style>
