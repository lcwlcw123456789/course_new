<template>
  <div class="chart-box" ref="chartRef">
    <button class="close-btn" @click="handleClose">×</button>
    <p v-if="!spec">点击图表加载中...</p>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from "vue";
import * as vegaEmbed from "vega-embed";

// 接收 props 和 emits
const props = defineProps({ spec: Object });
const emit = defineEmits(["close"]);
const chartRef = ref(null);

// 渲染函数
const renderChart = async () => {
  if (props.spec && chartRef.value) {
    await nextTick();
    const cleanSpec = JSON.parse(JSON.stringify(props.spec));
    await vegaEmbed.default(chartRef.value, cleanSpec, { actions: false });
  }
};

// 监听 spec 更新
watch(
  () => props.spec,
  () => renderChart(),
  { immediate: true }
);

// 初次挂载
onMounted(() => {
  if (props.spec) renderChart();
});

// 关闭按钮事件
const handleClose = () => {
  emit("close");
};
</script>

<style scoped>
.chart-box {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  background-color: #ffe4b5;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #aaa;
  font-size: 1.5rem;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 12px;
  background: #ff6961;
  color: white;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  font-size: 18px;
  cursor: pointer;
  z-index: 10;
}

.close-btn:hover {
  background-color: #e53935;
}
</style>
