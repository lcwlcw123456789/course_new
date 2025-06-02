<template>
  <div class="main-chart">
    <h2 class="title">📊 Food Value Trends</h2>
    <div ref="chartContainer" id="vega-chart"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import * as vegaEmbed from "vega-embed";

const chartContainer = ref(null);
const emit = defineEmits([
  "update:clickedChart",
  "update:hoveredChart",
  "update:clickedYearChart",
]);

onMounted(async () => {
  const result = await vegaEmbed.default(
    chartContainer.value,
    "/vega_line.json"
  );
  const view = result.view;

  view.addSignalListener("hoveredYear", async (_, value) => {
    if (!value) return emit("update:hoveredChart", null);
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
