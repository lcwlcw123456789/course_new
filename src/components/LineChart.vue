<template>
  <div class="main-chart" ref="wrapperRef">
    <h2 class="title">📊 Food Value Trends</h2>
    <div ref="chartContainer" class="vega-chart"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import * as vegaEmbed from "vega-embed";

const props = defineProps({
  containerCount: Number,
});
const emit = defineEmits([
  "update:clickedChart",
  "update:hoveredChart",
  "update:clickedYearChart",
]);

const chartContainer = ref(null);
const wrapperRef = ref(null);

const lockedHoveredYear = ref(null);
let resizeObserver;

// const getChartSize = () => {
//   if (props.containerCount === 0) return { width: 1000, height: 600 };
//   if (props.containerCount === 1) return { width: 600, height: 600 };
//   if (props.containerCount === 2) return { width: 600, height: 500 };
//   return { width: 500, height: 400 };
// };

const renderChart = async (width, height) => {
  const file = await fetch("/vega_line.json");
  const spec = await file.json();
  spec.width = width;
  spec.height = height;
  // console.log(spec.marks[1]);
  spec.marks[1].encode.enter.y.value = height;
  const result = await vegaEmbed.default(chartContainer.value, spec, {
    actions: false,
  });

  const view = result.view;

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
};

onMounted(() => {
  const resize = () => {
    if (!wrapperRef.value) return;
    const { width, height } = wrapperRef.value.getBoundingClientRect();
    console.log(`width: ${width}`);
    console.log(`height: ${height}`);
    renderChart(Math.floor(width) * 0.8, Math.floor(height - 40) * 0.6); // 40 为 title 高度
  };

  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(wrapperRef.value);

  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
  if (resizeObserver && wrapperRef.value)
    resizeObserver.unobserve(wrapperRef.value);
});

const handleClickOutside = (event) => {
  const wrapper = wrapperRef.value;
  const chartEl = chartContainer.value;
  const inWrapper = wrapper && wrapper.contains(event.target);
  const inChart = chartEl && chartEl.contains(event.target);
  if (inWrapper && !inChart) {
    lockedHoveredYear.value = null;
    emit("update:hoveredChart", null);
  }
};
</script>

<style scoped>
.main-chart {
  width: 100%;
  height: 100%;
  background-color: #e0f7fa;
  padding: 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
.title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 10px;
}
.vega-chart {
  flex: 1;
}
</style>
