<template>
  <div
    :key="forceRebuildKey"
    :class="['chart-container', { zoomed: isZoomed, visible: ready }]"
  >
    <h2 class="title" v-if="props.meta?.year">
      <button class="zoom-btn" @click="toggleZoom">
        {{ isZoomed ? "🔍➖" : "🔍➕" }}
      </button>
      📅 Year: {{ props.meta.year }}
    </h2>
    <div class="chart-box" ref="chartRef">
      <p v-if="!spec">点击图表加载中...</p>
    </div>
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

const ready = ref(false);

const isLocked = ref(false); // 🔒 锁定状态
const isZoomed = ref(false);
const forceRebuildKey = ref(0);

const toggleZoom = async () => {
  isZoomed.value = !isZoomed.value;

  await nextTick(); // 等待 DOM 更新后再执行渲染
  await renderChart(); // 重新渲染 Vega 图
};

const renderChart = async () => {
  if (props.spec && chartRef.value) {
    console.log("🔧 Rendering Vega chart in BarChart");
    await nextTick();
    const cleanSpec = JSON.parse(JSON.stringify(props.spec));
    cleanSpec.autosize = {
      type: "fit",
      resize: true,
      contains: "padding",
    };
    if (isZoomed.value) {
      cleanSpec.width = 500;
      cleanSpec.height = 500;
    } else {
      cleanSpec.width = 350;
      cleanSpec.height = 350;
    }
    await vegaEmbed.default(chartRef.value, cleanSpec, { actions: false });

    ready.value = true;
  }
};

const handleClose = () => {
  console.log("🚪 Close button clicked in BarChart");
  emit("close");
};

const toggleLock = () => {
  isLocked.value = !isLocked.value;
  console.log(`🔐 Chart is now ${isLocked.value ? "locked" : "unlocked"}`);
};

watch(
  () => props.spec,
  () => {
    if (!isLocked.value) {
      renderChart();
    } else {
      console.log("⛔ Chart update ignored (locked)");
    }
  },
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
  transition: all 0.3s ease-in-out;

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

.chart-box {
  flex: 1;
  background-color: #ffffff;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #aaa;
  font-size: 1.5rem;
  box-sizing: border-box;
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

/* 锁定按钮样式 */
.lock-btn {
  position: absolute;
  top: 20px;
  right: 130px;
  font-size: 14px;
  background: linear-gradient(to right, #ff758c, #ff7eb3);
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

.lock-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.25);
  background: linear-gradient(to right, #f77062, #fe5196);
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
