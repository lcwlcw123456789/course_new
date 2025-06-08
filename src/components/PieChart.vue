<template>
  <div class="chart-container">
    <h2 class="title" v-if="props.meta?.year">
      📅 Year: {{ props.meta.year }}
    </h2>
    <div class="chart-box" ref="chartRef">
      <p v-if="!spec">点击图表加载中...</p>
    </div>
    <button class="close-btn" @click="handleClose">🏠</button>
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
const isLocked = ref(false); // 🔒 锁定状态

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
    await vegaEmbed.default(chartRef.value, cleanSpec, { actions: false });
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
  console.log("📦 BarChart mounted with spec:", props.spec);
  console.log("📅 PieChart meta:", props.meta);
  if (props.spec) renderChart();
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
  background-color: #ffffff;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #aaa;
  font-size: 1.5rem;
  box-sizing: border-box;
}

/* 关闭按钮样式 */
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
  padding: 8px 16px;
  margin: 0;
  color: #000000;
  background-color: #ffffff; /* 为了能看到标题效果 */
}
</style>
