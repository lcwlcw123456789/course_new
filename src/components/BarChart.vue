<template>
  <div class="chart-container">
    <div class="chart-box" ref="chartRef">
      <p v-if="!spec">点击图表加载中...</p>
    </div>
    <button class="close-btn" @click="handleClose">🏠</button>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from "vue";
import * as vegaEmbed from "vega-embed";

defineOptions({ name: "BarChart" });

const props = defineProps({ spec: Object });
const emit = defineEmits(["close"]);
const chartRef = ref(null);

const renderChart = async () => {
  if (props.spec && chartRef.value) {
    console.log("🔧 Rendering Vega chart in BarChart");
    await nextTick();
    const cleanSpec = JSON.parse(JSON.stringify(props.spec));
    await vegaEmbed.default(chartRef.value, cleanSpec, { actions: false });
  }
};

const handleClose = () => {
  console.log("🚪 Close button clicked in BarChart");
  emit("close");
};

watch(
  () => props.spec,
  () => renderChart(),
  { immediate: true }
);

onMounted(() => {
  console.log("📦 BarChart mounted with spec:", props.spec);
  if (props.spec) renderChart();
});
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

</style>
