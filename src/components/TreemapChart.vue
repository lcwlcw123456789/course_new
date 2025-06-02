<template>
  <div class="chart-box" ref="chartRef">
    <p v-if="!spec">点击图表加载中...</p>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from "vue";
import * as vegaEmbed from "vega-embed";

// Props 接收 Vega spec
const props = defineProps({ spec: Object });
const chartRef = ref(null);

// 渲染函数
const renderChart = async () => {
  if (props.spec && chartRef.value) {
    await nextTick(); // 确保 DOM 渲染完毕
    const cleanSpec = JSON.parse(JSON.stringify(props.spec)); // 深拷贝以防修改
    await vegaEmbed.default(chartRef.value, cleanSpec, { actions: false });
  }
};

// 立即监听 spec
watch(
  () => props.spec,
  () => renderChart(),
  { immediate: true }
);

// 如果父组件挂载时已经传入 spec，可直接渲染
onMounted(() => {
  if (props.spec) renderChart();
});
</script>

<style scoped>
.chart-box {
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
</style>
