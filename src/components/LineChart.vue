<template>
  <div class="main-chart">
    <h2 class="title">📊 Food Value Trends</h2>
    <div ref="chartContainer" id="vega-chart"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import * as vegaEmbed from "vega-embed";

const chartContainer = ref(null);
const emit = defineEmits([
  "update:clickedChart",
  "update:hoveredChart",
  "update:clickedYearChart",
]);

const lockedHoveredYear = ref(null); // 新增：锁定状态

const resetHover = () => {
  lockedHoveredYear.value = null;
  emit("update:hoveredChart", null);
};

onMounted(async () => {
  const result = await vegaEmbed.default(
    chartContainer.value,
    "/vega_line.json"
  );
  const view = result.view;

  // 监听 hoveredYear：只更新不一样的 hover 年份
  view.addSignalListener("hoveredYear", async (_, value) => {
    if (!value || (lockedHoveredYear.value?.year === value.year)) return;

    lockedHoveredYear.value = value;
    const fileName = `/vega_charts_2/vega_pie_${value.year}.json`;
    const res = await fetch(fileName);
    const spec = await res.json();
    emit("update:hoveredChart", spec);
  });

  view.addSignalListener("clicked", async (_, value) => {
    if (!value) return emit("update:clickedChart", null);
    const fileName = `/vega_f11/${value.year}_${value.category}_vega.json`;
    const res = await fetch(fileName);
    const spec = await res.json();
    emit("update:clickedChart", spec);
  });

  view.addSignalListener("clickedYear", async (_, value) => {
    if (!value) return emit("update:clickedYearChart", null);
    const fileName = `/vega3/${value.year}_WORLD.json`;
    const res = await fetch(fileName);
    const spec = await res.json();
    emit("update:clickedYearChart", spec);
  });

  // 点击图外清除 hovered 图（修复：延迟绑定，避免与 Vega 冲突）
  setTimeout(() => {
    document.addEventListener("click", (e) => {
      const chartEl = chartContainer.value;
      if (!chartEl.contains(e.target)) {
        lockedHoveredYear.value = null;
        emit("update:hoveredChart", null);
      }
    });
  }, 100); // 延迟绑定，让 Vega 内部事件先注册
});


</script>

<style scoped>
.main-chart {
  /* height: 100%; */
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  background-color: #e0f7fa;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.title {
  margin-bottom: 10px;
  font-size: 20px;
  font-weight: bold;
}
#vega-chart {
  border: 1px solid #ccc;
  padding: 10px;
  height: 100%;
}
</style>
