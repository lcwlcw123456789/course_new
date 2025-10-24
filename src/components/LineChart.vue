<template>
  <div class="main-chart" ref="wrapperRef">
    <div class="header">
      <h2 class="title">📊 Food Value Trends</h2>
    </div>

    <div ref="chartContainer" class="vega-chart"></div>

    <button class="mode-btn" @click="toggleMode">
      {{ isLinkMode ? "📈 切换为图像展示模式" : "🔗 切换为链接跳转模式" }}
    </button>

    <button class="chart-mode-btn" @click="toggleChartMode">
      {{ chartMode === "pie" ? "🥧 当前：piechart" : "🌲 当前：treemap" }}
    </button>

    <div
      class="custom-message"
      v-show="showMessage"
      :class="{ visible: showMessage }"
    >
      {{ messageText }}
    </div>

    <div class="source-selector">
      <select v-model="source">
        <option value="agri-pulse">🌎 Agri-Pulse</option>
        <option value="foodbusinessnews">📰 Food Business News</option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import * as vegaEmbed from "vega-embed";

const emit = defineEmits([
  "update:clickedChart",
  "update:hoveredChart",
  "update:clickedYearChart",
]);

const chartContainer = ref(null);
const wrapperRef = ref(null);

const isLinkMode = ref(false); // 🔗 or 📈
const chartMode = ref("pie"); // pie or treemap

const lockedHoveredYear = ref(null);
let resizeObserver;

const showMessage = ref(false);
const messageText = ref("");
const source = ref("agri-pulse");

function showCustomMessage(text) {
  messageText.value = text;
  showMessage.value = true;
  setTimeout(() => (showMessage.value = false), 3000);
}

function toggleMode() {
  isLinkMode.value = !isLinkMode.value;
  showCustomMessage(
    isLinkMode.value
      ? "🔗 链接跳转模式已启用，请点击异常点或年份查看相关新闻"
      : "📈 图像展示模式已启用"
  );
}

function toggleChartMode() {
  chartMode.value = chartMode.value === "pie" ? "treemap" : "pie";
  showCustomMessage(
    chartMode.value === "pie"
      ? "🥧 点击年份将展示 piechart"
      : "🌲 点击年份将展示 treemap"
  );
}

const renderChart = async (width, height) => {
  const file = await fetch("/vega_line.json");
  const spec = await file.json();
  spec.width = width;
  spec.height = height;
  spec.marks[1].encode.enter.y.value = height;

  const yearAxis = spec.axes.find((axis) => axis.orient === "bottom");
  if (width < 600) {
    yearAxis.labelAngle = -90;
    yearAxis.labelAlign = "right";
    yearAxis.labelBaseline = "middle";
  } else {
    yearAxis.labelAngle = 0;
    yearAxis.labelAlign = "center";
    yearAxis.labelBaseline = "top";
  }

  const result = await vegaEmbed.default(chartContainer.value, spec, {
    actions: false,
  });

  const view = result.view;

  view.addSignalListener("clicked", async (_, value) => {
    if (!value) return;

    if (isLinkMode.value) {
      if (value.category && value.event) {
        const baseDomain =
          source.value === "agri-pulse"
            ? "www.agri-pulse.com"
            : "www.foodbusinessnews.net";

        const url = `https://${baseDomain}/search?utf8=%E2%9C%93&q=${encodeURIComponent(
          value.category
        )}&author=&datatype=&start_date=01%2F01%2F${
          value.year
        }&end_date=12%2F30%2F${value.year}&Submit=Submit`;

        window.open(url, "_blank");
      } else {
        showCustomMessage(
          `${value.year} 年 ${value.category} 数据正常，无需细究`
        );
      }
    } else {
      const fileName = `/vega_f11/${value.year}_${value.category}_vega.json`;
      const res = await fetch(fileName);
      const spec = await res.json();

      emit("update:clickedChart", {
        ...spec,
        year: value.year,
        category: value.category,
      });
    }
  });

  view.addSignalListener("clickedYear", async (_, value) => {
    if (!value) return;

    if (isLinkMode.value) {
      const file = await fetch("/vega_line.json");
      const spec = await file.json();
      const yearData = spec.data[0].values.filter(
        (item) => item.year === value.year
      );
      const hasNormal = yearData.some((item) => !item.event);

      if (hasNormal) {
        showCustomMessage(`${value.year} 年数据整体正常，无需跳转`);
      } else {
        const baseDomain =
          source.value === "agri-pulse"
            ? "www.agri-pulse.com"
            : "www.foodbusinessnews.net";

        const url = `https://${baseDomain}/search?utf8=%E2%9C%93&q=${encodeURIComponent(
          value.event
        )}&author=&datatype=&start_date=01%2F01%2F${
          value.year
        }&end_date=12%2F30%2F${value.year}&Submit=Submit`;

        window.open(url, "_blank");
      }
    } else {
      const path =
        chartMode.value === "pie"
          ? `/vega_charts_2/vega_pie_${value.year}.json`
          : `/vega3/${value.year}_WORLD.json`;
      const res = await fetch(path);
      const spec = await res.json();
      if (chartMode.value === "pie") {
        emit("update:clickedYearChart_pie", {
          ...spec,
          year: value.year,
          category: value.category,
        });
      } else {
        emit("update:clickedYearChart_treemap", {
          ...spec,
          year: value.year,
          category: value.category,
        });
      }
    }
  });
};

onMounted(() => {
  const resize = () => {
    if (!wrapperRef.value) return;
    const { width, height } = wrapperRef.value.getBoundingClientRect();
    renderChart(Math.floor(width) * 0.75, Math.floor(height - 40) * 0.7);
  };

  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(wrapperRef.value);
});

onBeforeUnmount(() => {
  if (resizeObserver && wrapperRef.value)
    resizeObserver.unobserve(wrapperRef.value);
});
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
  position: relative;
}

.title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 10px;
}

.vega-chart {
  flex: 1;
}

/* 按钮通用样式 */
.mode-btn,
.chart-mode-btn {
  position: absolute;
  font-size: 14px;
  background: linear-gradient(to right, #ffcc70, #ff9a8b);
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

.mode-btn:hover,
.chart-mode-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.25);
  background: linear-gradient(to right, #f6c667, #ff7b72);
}

.mode-btn {
  top: 20px;
  right: 30px;
}

.chart-mode-btn {
  top: 20px;
  left: 30px;
}

.custom-message {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(to right, #b2ebf2, #80deea);
  color: #004d40;
  padding: 10px 18px;
  border-radius: 12px;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.5s ease;
  z-index: 10;
}

.custom-message.visible {
  opacity: 1;
  pointer-events: auto;
}

.source-selector {
  position: absolute;
  bottom: 20px;
  left: 30px;
  z-index: 10;
}

.source-selector select {
  appearance: none;
  background: linear-gradient(to right, #a1c4fd, #c2e9fb);
  color: rgb(53, 45, 45);
  border: none;
  padding: 8px 14px;
  border-radius: 30px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.source-selector select:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.25);
  background: linear-gradient(to right, #91bdf4, #b3e5fc);
}
</style>
