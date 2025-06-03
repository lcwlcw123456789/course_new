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

  // 监听 hoveredYear，但如果当前锁定，则不处理
  view.addSignalListener("hoveredYear", async (_, value) => {
    if (!value || value === lockedHoveredYear.value) return;

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

  // 点击图外区域清除 hover 图
  const handleClickOutside = (event) => {
    const wrapper = document.querySelector(".line-chart-wrapper");
    const chartEl = chartContainer.value;

    // 条件1：点在 wrapper 内部
    const inWrapper = wrapper && wrapper.contains(event.target);
    // 条件2：点不在 Vega 图形上
    const inChart = chartEl && chartEl.contains(event.target);

    if (inWrapper && !inChart) {
      resetHover();
    }
  };

  document.addEventListener("click", handleClickOutside);

  // Vue 生命周期清理
  onBeforeUnmount(() => {
    document.removeEventListener("click", handleClickOutside);
  });

  // 仍然保留点击空白区域清空 clicked、clickedYear 的逻辑
  view.addEventListener("click", (event, item) => {
    if (
      !item ||
      (item.mark.name !== "points" && item.mark.name !== "xAxisPoints")
    ) {
      view.signal("clicked", null).runAsync();
      view.signal("clickedYear", null).runAsync();
    }
  });
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