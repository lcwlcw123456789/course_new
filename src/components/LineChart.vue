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

  const onDocumentClick = (event) => {
    const chartEl = chartContainer.value;

    if (!chartEl.contains(event.target)) {
      // 点击画外区域，清空所有相关信号和状态
      lockedHoveredYear.value = null;
      emit("update:hoveredChart", null);
      view.signal("clicked", null).runAsync();
      view.signal("clickedYear", null).runAsync();
    }
    // 点击画内，不清空，保留信号，保持功能正常
  };
  document.addEventListener("click", onDocumentClick);

  // 原来的 view 点击监听，只处理点击点标记，不做信号清空
  view.addEventListener("click", (event, item) => {
    // 如果点击非点标记，交由 document 监听处理
    // 这里可以不再操作信号，避免冲突
  });

  onBeforeUnmount(() => {
    document.removeEventListener("click", onDocumentClick);
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
