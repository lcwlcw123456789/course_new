<template>
  <div class="main-chart" ref="wrapperRef" :class="[theme]">
    <div class="header">
      <h2 class="title">📊 Food Value Trends</h2>
    </div>

    <div ref="chartContainer" class="vega-chart"></div>

    <!-- 模式按钮 -->
    <button class="mode-btn" @click="toggleMode">
      {{ isLinkMode ? "📈 切换为图像展示模式" : "🔗 切换为链接跳转模式" }}
    </button>

    <button class="chart-mode-btn" @click="toggleChartMode">
      {{ chartMode === "pie" ? "🥧 当前：piechart" : "🌲 当前：treemap" }}
    </button>

    <!-- 主题切换 -->
    <button class="theme-btn" @click="toggleTheme">🌓 {{ themeLabel }}</button>

    <!-- 类别选择器 -->
    <div class="category-selector">
      <label>
        类别：
        <select v-model="selectedCategory" @change="onSelectCategory">
          <option value="">全部</option>
          <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
        </select>
      </label>
      <button v-if="selectedCategory" @click="clearSelected">清除</button>
    </div>

    <!-- 覆盖层选项 -->
    <div class="overlay-controls">
      <label
        ><input
          type="checkbox"
          v-model="showAverage"
          @change="reRenderWithOverlays"
        />
        平均值线</label
      >
      <label
        ><input
          type="checkbox"
          v-model="showTrend"
          @change="reRenderWithOverlays"
        />
        趋势线</label
      >
      <label
        ><input
          type="checkbox"
          v-model="showPrediction"
          @change="reRenderWithOverlays"
        />
        预测线</label
      >
      <div v-if="showPrediction" class="prediction-controls">
        <label
          >平滑窗口: {{ smoothWindow
          }}<input
            type="range"
            min="1"
            max="6"
            v-model.number="smoothWindow"
            @input="reRenderWithOverlays"
        /></label>
        <label
          >预测年数: {{ predictYears
          }}<input
            type="range"
            min="1"
            max="8"
            v-model.number="predictYears"
            @input="reRenderWithOverlays"
        /></label>
        <label>
          预测方法：
          <select v-model="predictMethod" @change="reRenderWithOverlays">
            <option value="linear">线性</option>
            <option value="poly2">二次多项式</option>
            <option value="poly3">三次多项式</option>
            <option value="holt">Holt 指数平滑</option>
            <option value="exp">指数增长（对数线性）</option>
            <option value="ar2">AR(2) 自回归</option>
          </select>
        </label>
        <label
          ><input
            type="checkbox"
            v-model="smoothObserved"
            @change="reRenderWithOverlays"
          />
          对历史做移动平均平滑</label
        >
      </div>
    </div>

    <!-- 推荐与相关 -->
    <div class="insight-controls">
      <button @click="emitRecommendations">⭐ 智能推荐</button>
      <!-- 主界面去掉关联分析按钮 -->
      <!-- <button :disabled="!canCorrelate" @click="emitCorrelations">🔗 关联分析</button> -->
    </div>

    <!-- 详情浮窗：选中类别后显示 -->
    <div v-if="detailVisible" class="detail-modal" :class="[theme]">
      <div class="detail-header">
        <strong>📌 {{ selectedCategory }}</strong>
        <div class="spacer"></div>
        <button class="mini-btn" @click="openCorrelationModal">相关</button>
        <button class="mini-btn" @click="closeDetail">关闭</button>
      </div>

      <div class="detail-controls">
        <label
          ><input
            type="checkbox"
            v-model="dShowAverage"
            @change="reRenderDetail"
          />
          平均值线</label
        >
        <label
          ><input
            type="checkbox"
            v-model="dShowTrend"
            @change="reRenderDetail"
          />
          趋势线</label
        >
        <label
          ><input
            type="checkbox"
            v-model="dShowPrediction"
            @change="reRenderDetail"
          />
          预测线</label
        >
        <div v-if="dShowPrediction" class="detail-prediction-controls">
          <label
            >平滑窗口: {{ dSmoothWindow
            }}<input
              type="range"
              min="1"
              max="6"
              v-model.number="dSmoothWindow"
              @input="reRenderDetail"
          /></label>
          <label
            >预测年数: {{ dPredictYears
            }}<input
              type="range"
              min="1"
              max="8"
              v-model.number="dPredictYears"
              @input="reRenderDetail"
          /></label>
          <label>
            预测方法：
            <select v-model="dPredictMethod" @change="reRenderDetail">
              <option value="linear">线性</option>
              <option value="poly2">二次多项式</option>
              <option value="poly3">三次多项式</option>
              <option value="holt">Holt 指数平滑</option>
              <option value="exp">指数增长（对数线性）</option>
              <option value="ar2">AR(2) 自回归</option>
            </select>
          </label>
          <label
            ><input
              type="checkbox"
              v-model="dSmoothObserved"
              @change="reRenderDetail"
            />
            对历史做移动平均平滑</label
          >
        </div>
      </div>

      <div class="detail-body">
        <div ref="detailContainer" class="detail-vega"></div>
        <div v-if="selectedMetrics" class="stats-grid">
          <div class="stat">
            <div class="stat-title">📅 年份与样本</div>
            <div class="stat-value">
              {{ selectedMetrics.spanYears }} 年（{{ selectedMetrics.years }}
              点）
            </div>
          </div>
          <div class="stat">
            <div class="stat-title">🎯 最新值</div>
            <div class="stat-value">{{ num(selectedMetrics.last) }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">📊 均值</div>
            <div class="stat-value">{{ num(selectedMetrics.mean) }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">📈 中位数</div>
            <div class="stat-value">{{ num(selectedMetrics.median) }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">📉 标准差</div>
            <div class="stat-value">{{ num(selectedMetrics.valueStd) }}</div>
          </div>
          <div class="stat">
            <div class="stat-title">🔻 最小值</div>
            <div class="stat-value">
              {{ num(selectedMetrics.min, 1)
              }}<span class="muted">（{{ selectedMetrics.worstYear }}）</span>
            </div>
          </div>
          <div class="stat">
            <div class="stat-title">🔺 最大值</div>
            <div class="stat-value">
              {{ num(selectedMetrics.max, 1)
              }}<span class="muted">（{{ selectedMetrics.bestYear }}）</span>
            </div>
          </div>
          <div class="stat wide">
            <div class="stat-title">📈 复合增速</div>
            <div class="sub-row">
              年均（CAGR）：<strong>{{
                toPercent(selectedMetrics.cagr)
              }}</strong>
            </div>
            <div class="sub-row">
              近三年：<strong>{{
                toPercent(selectedMetrics.lastThreeYearGrowth)
              }}</strong>
              ｜ 近五年：<strong>{{
                toPercent(selectedMetrics.lastFiveYearCAGR)
              }}</strong>
            </div>
          </div>
          <div class="stat">
            <div class="stat-title">📆 同比</div>
            <div class="sub-row">
              平均同比：<strong>{{
                toPercent(selectedMetrics.avgYoYGrowth)
              }}</strong>
            </div>
            <div class="sub-row">
              最近一年：<strong>{{
                toPercent(selectedMetrics.lastYoY)
              }}</strong>
            </div>
          </div>
          <div class="stat">
            <div class="stat-title">➕ 总和增长</div>
            <div class="sub-row">
              绝对：<strong>{{ num(selectedMetrics.totalGrowthAbs) }}</strong>
            </div>
            <div class="sub-row">
              比例：<strong>{{
                toPercent(selectedMetrics.totalGrowthRate)
              }}</strong>
            </div>
          </div>
          <div class="stat">
            <div class="stat-title">📈📉 涨跌统计</div>
            <div class="chips">
              <span class="chip up">↑ {{ selectedMetrics.increases }}</span>
              <span class="chip down">↓ {{ selectedMetrics.decreases }}</span>
            </div>
            <div class="sub-row">
              上涨占比：<strong>{{
                toPercent(selectedMetrics.increasesRatio)
              }}</strong>
            </div>
          </div>
          <div class="stat">
            <div class="stat-title">📐 趋势拟合</div>
            <div class="sub-row">
              斜率：<strong>{{ fmt(selectedMetrics.slope) }}</strong>
            </div>
            <div class="sub-row">
              R²：<strong>{{ (selectedMetrics.r2 * 100).toFixed(2) }}%</strong>
            </div>
          </div>
          <div class="stat">
            <div class="stat-title">🛡️ 最大回撤</div>
            <div class="stat-value">
              {{ toPercent(selectedMetrics.maxDrawdown) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 相关分析独立窗口 -->
    <div v-if="correlationVisible" class="correlation-modal" :class="[theme]">
      <div class="detail-header">
        <strong>🔗 与 {{ selectedCategory }} 的相关分析</strong>
        <div class="spacer"></div>
        <button class="mini-btn" @click="closeCorrelationModal">关闭</button>
      </div>
      <div class="correlation-body">
        <div ref="correlationContainer" class="correlation-vega"></div>
      </div>
    </div>

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
import {
  ref,
  onMounted,
  onBeforeUnmount,
  computed,
  watch,
  nextTick,
} from "vue";
import * as vegaEmbed from "vega-embed";
import {
  computeMetrics,
  topRecommendations,
  correlationMatrix,
  predictLinear,
  groupByCategory,
  predictPolynomial,
  movingAverageSeries,
  linearRegression,
  polynomialRegression,
  predictByMethod,
  lastFittedForMethod,
} from "@/utils/analytics";
import { getLineChartData } from "@/api/line_chart";
import { getPieChartData } from "@/api/pie_chart";
import { getTreemapChartData } from "@/api/treemap_chart";
import { getWorldChartData } from "@/api/world_chart";

const emit = defineEmits([
  "update:clickedChart",
  "update:hoveredChart",
  "update:clickedYearChart_pie",
  "update:clickedYearChart_treemap",
  "update:recommendations",
  "update:correlations",
]);

const chartContainer = ref(null);
const detailContainer = ref(null);
const wrapperRef = ref(null);

const isLinkMode = ref(false); // 🔗 or 📈
const chartMode = ref("pie"); // pie or treemap

const theme = ref("day");
const themeLabel = ref("日间模式");

let resizeObserver;

const showMessage = ref(false);
const messageText = ref("");
const source = ref("agri-pulse");

// 数据与类别
let rawData = [];
const categories = ref([]);
const selectedCategory = ref("");
const lastClickedCategory = ref(null);

// 详情窗可见性
const detailVisible = ref(false);

// 指标缓存与选中指标
const metricsByCategory = ref({});
const selectedMetrics = computed(() => {
  return metricsByCategory.value[selectedCategory.value] || null;
});

// 覆盖层开关
const showAverage = ref(false);
const showTrend = ref(false);
const showPrediction = ref(false);
const smoothWindow = ref(3);
const predictYears = ref(5);
const predictMethod = ref("poly2");
const smoothObserved = ref(true);

// Detail overlay independent controls
const dShowAverage = ref(true);
const dShowTrend = ref(true);
const dShowPrediction = ref(true);
const dSmoothWindow = ref(3);
const dPredictYears = ref(5);
const dPredictMethod = ref("poly2");
const dSmoothObserved = ref(true);

const correlationVisible = ref(false);
const correlationContainer = ref(null);

function fmt(v) {
  return typeof v === "number" ? v.toFixed(1) : v;
}
function toPercent(v) {
  return (v * 100).toFixed(2) + "%";
}
// 美化用数字格式化（千分位，小数位可控）
function num(v, digits = 1) {
  return typeof v === "number"
    ? v.toLocaleString("zh-CN", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })
    : v;
}

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

function toggleTheme() {
  theme.value = theme.value === "day" ? "night" : "day";
  themeLabel.value = theme.value === "day" ? "日间模式" : "夜间模式";
  reRenderWithOverlays();
}

function onSelectCategory() {
  // 打开详情窗，主图不高亮
  lastClickedCategory.value = null;
  detailVisible.value = !!selectedCategory.value;
  if (detailVisible.value) {
    reRenderDetail();
  } else {
    reRenderWithOverlays();
  }
}

function clearSelected() {
  selectedCategory.value = "";
  lastClickedCategory.value = null;
  detailVisible.value = false;
  reRenderWithOverlays();
}

function closeDetail() {
  detailVisible.value = false;
  // 不清空选择，允许保留选择状态仅关闭窗口
}

function emitRecommendations() {
  if (!rawData.length) return;
  const metrics = Object.values(metricsByCategory.value);
  const top = topRecommendations(metrics);
  emit("update:recommendations", {
    title: "智能推荐 (Top5)",
    mode: "recommendations",
    data: top,
  });
}

function emitCorrelations() {
  const focus = getFocusCategoryName();
  if (!rawData.length || !focus) return;
  const matrix = correlationMatrix(rawData);
  const list = matrix[focus] || [];
  emit("update:correlations", {
    title: `与 ${focus} 高相关的食品 (Top10)`,
    mode: "correlations",
    data: list.slice(0, 10),
    category: focus,
  });
}

async function openCorrelationModal() {
  if (!selectedCategory.value) return;
  correlationVisible.value = true;
  await renderCorrelationModal();
}
function closeCorrelationModal() {
  correlationVisible.value = false;
}

async function renderCorrelationModal() {
  await nextTick();
  if (!correlationContainer.value) return;
  const focus = selectedCategory.value;
  const matrix = correlationMatrix(rawData);
  const list = (matrix[focus] || []).slice(0, 20); // Top 20 by |corr|
  const values = list.map((d) => ({
    target: d.category,
    correlation: d.correlation,
    sign: d.correlation >= 0 ? "正" : "负",
  }));
  // Build Vega spec for horizontal bar chart
  const spec = {
    $schema: "https://vega.github.io/schema/vega/v5.json",
    width: 760,
    height: Math.max(260, values.length * 22 + 20),
    padding: 10,
    background: theme.value === "night" ? "#1e1e1e" : "#ffffff",
    data: [{ name: "table", values }],
    scales: [
      {
        name: "yscale",
        type: "band",
        domain: { data: "table", field: "target" },
        range: "height",
        padding: 0.2,
      },
      {
        name: "xscale",
        type: "linear",
        domain: [-1, 1],
        range: "width",
        nice: true,
        zero: true,
      },
      {
        name: "color",
        type: "ordinal",
        domain: ["正", "负"],
        range: ["#2ca02c", "#d62728"],
      },
    ],
    axes: [
      {
        orient: "bottom",
        scale: "xscale",
        grid: true,
        labelColor: theme.value === "night" ? "#ddd" : "#444",
        title: "相关系数 (Pearson)",
      },
      {
        orient: "left",
        scale: "yscale",
        labelColor: theme.value === "night" ? "#ddd" : "#444",
      },
    ],
    marks: [
      {
        type: "rect",
        from: { data: "table" },
        encode: {
          enter: {
            y: { scale: "yscale", field: "target" },
            height: { scale: "yscale", band: 1 },
            x: { scale: "xscale", value: 0 },
            x2: { scale: "xscale", field: "correlation" },
            fill: { scale: "color", field: "sign" },
            tooltip: {
              signal:
                "{类别: datum.target, 相关: format(datum.correlation, '.2f')}",
            },
          },
        },
      },
    ],
  };
  try {
    await vegaEmbed.default(correlationContainer.value, spec, {
      actions: false,
    });
  } catch (e) {
    console.error("❌ 相关窗口渲染失败", e);
    showCustomMessage("相关窗口渲染失败");
  }
}

async function loadBaseSpec() {
  try {
    const res = await getLineChartData();
    console.log(res);
    const spec = res.data;
    console.log(spec);
    // const file = await fetch("/vega_line.json");
    // const spec = await file.json();
    rawData = spec.data[0].values.map((d) => ({
      ...d,
      food_value: +d.food_value,
    }));
    categories.value = Array.from(new Set(rawData.map((d) => d.category)));
    // 预计算指标
    const m = {};
    computeMetrics(rawData).forEach((item) => (m[item.category] = item));
    metricsByCategory.value = m;
    return spec;
  } catch (error) {
    console.error("Error: ", error);
  }
}

function buildColorRange(baseRange) {
  if (theme.value === "night") {
    const darkMap = [
      "#1f4d73",
      "#5a7d5a",
      "#555555",
      "#b4843d",
      "#5e4680",
      "#1d6e1d",
      "#5f4331",
      "#8b8c15",
      "#c35e00",
      "#9e4c85",
      "#7a98b8",
      "#8e2727",
      "#0d6d72",
      "#666666",
    ];
    if (baseRange.length === darkMap.length) return darkMap;
  }
  return baseRange;
}

function getAverageSeries() {
  const byYear = {};
  rawData.forEach((d) => {
    const y = d.year;
    if (!byYear[y]) byYear[y] = [];
    byYear[y].push(d.food_value);
  });
  return Object.keys(byYear)
    .sort((a, b) => +a - +b)
    .map((y) => ({
      year: y,
      category: "Average",
      food_value: byYear[y].reduce((a, b) => a + b, 0) / byYear[y].length,
    }));
}

function getFocusCategoryName() {
  // 仅用于相关分析：优先选中类别，其次最后点击类别
  if (selectedCategory.value) return selectedCategory.value;
  if (lastClickedCategory.value) return lastClickedCategory.value;
  return null;
}

// 计算某类别的整体均值（常数水平线）
function getCategoryMeanValue(cat) {
  const byCat = groupByCategory(rawData);
  const series = byCat.get(cat) || [];
  if (!series.length) return null;
  const mean = series.reduce((s, d) => s + d.food_value, 0) / series.length;
  return { value: mean, seriesYears: series.map((d) => d.year) };
}

// 添加覆盖层，支持选项：
// options = {
//   focusCategoryName: string|null,
//   averageMode: 'global' | 'category',
//   forceSingleCategoryPrediction: boolean
// }
function addOverlays(spec, options = {}, overlay = null) {
  if (!rawData.length) return spec;

  const augmented = JSON.parse(JSON.stringify(spec));

  // ✅ 清理旧 overlay，避免重复叠加
  augmented.data = augmented.data.filter(
    (d) => !d.name.startsWith("prediction") && !d.name.endsWith("_series")
  );
  augmented.marks = augmented.marks.filter(
    (m) =>
      !(
        (m.type === "line" || m.type === "group") &&
        (m.from?.data?.startsWith("prediction") ||
          m.from?.data?.endsWith("_series"))
      )
  );
  const {
    focusCategoryName = null,
    averageMode = "global",
    forceSingleCategoryPrediction = false,
  } = options;
  const byCat = groupByCategory(rawData);

  // derive overlay config (use overrides when provided)
  const cfg = {
    showAverage:
      overlay && overlay.showAverage !== undefined
        ? overlay.showAverage
        : showAverage.value,
    showTrend:
      overlay && overlay.showTrend !== undefined
        ? overlay.showTrend
        : showTrend.value,
    showPrediction:
      overlay && overlay.showPrediction !== undefined
        ? overlay.showPrediction
        : showPrediction.value,
    smoothWindow:
      overlay && overlay.smoothWindow !== undefined
        ? overlay.smoothWindow
        : smoothWindow.value,
    predictYears:
      overlay && overlay.predictYears !== undefined
        ? overlay.predictYears
        : predictYears.value,
    predictMethod:
      overlay && overlay.predictMethod !== undefined
        ? overlay.predictMethod
        : predictMethod.value,
    smoothObserved:
      overlay && overlay.smoothObserved !== undefined
        ? overlay.smoothObserved
        : smoothObserved.value,
  };

  const overlayMarks = [];
  let addedPrediction = false;
  const predictionDataNames = [];

  // Compute global average once if needed
  let avgSeriesCache = null;
  const ensureAvg = () => {
    if (!avgSeriesCache) avgSeriesCache = getAverageSeries();
    return avgSeriesCache;
  };

  // Average line
  if (cfg.showAverage) {
    if (averageMode === "category" && focusCategoryName) {
      const meanInfo = getCategoryMeanValue(focusCategoryName);
      if (meanInfo) {
        const meanSeries = meanInfo.seriesYears.map((y) => ({
          year: y,
          category: focusCategoryName,
          food_value: meanInfo.value,
        }));
        augmented.data.push({
          name: "category_mean_series",
          values: meanSeries,
        });
        overlayMarks.push({
          type: "line",
          from: { data: "category_mean_series" },
          encode: {
            enter: {
              x: { scale: "xscale", field: "year" },
              y: { scale: "yscale", field: "food_value" },
              stroke: { value: theme.value === "night" ? "#ffff66" : "#000" },
              strokeDash: { value: [4, 4] },
              strokeWidth: { value: 2 },
              opacity: { value: 0.9 },
            },
          },
        });
      }
    } else {
      const avgSeries = ensureAvg();
      augmented.data.push({ name: "average_series", values: avgSeries });
      overlayMarks.push({
        type: "line",
        from: { data: "average_series" },
        encode: {
          enter: {
            x: { scale: "xscale", field: "year" },
            y: { scale: "yscale", field: "food_value" },
            stroke: { value: theme.value === "night" ? "#ffff66" : "#000" },
            strokeDash: { value: [4, 4] },
            strokeWidth: { value: 2 },
          },
        },
      });
    }
  }

  // Determine focus series (for trend/prediction)
  let focusSeries = null;
  if (focusCategoryName && byCat.get(focusCategoryName)) {
    focusSeries = byCat.get(focusCategoryName);
  }

  // Trend line (single series when focus available)
  if (cfg.showTrend && focusSeries && focusSeries.length) {
    const { a, b } = (function lr() {
      const years = focusSeries.map((d) => +d.year);
      const values = focusSeries.map((d) => d.food_value);
      const n = years.length;
      const sumX = years.reduce((p, c) => p + c, 0);
      const sumY = values.reduce((p, c) => p + c, 0);
      const sumXY = years.reduce((p, c, i) => p + c * values[i], 0);
      const sumX2 = years.reduce((p, c) => p + c * c, 0);
      const denom = n * sumX2 - sumX * sumX;
      if (!denom) return { a: 0, b: 0 };
      const b = (n * sumXY - sumX * sumY) / denom;
      const a = (sumY - b * sumX) / n;
      return { a, b };
    })();
    const trendSeries = focusSeries.map((d) => ({
      year: d.year,
      food_value: a + b * +d.year,
    }));
    augmented.data.push({ name: "trend_series", values: trendSeries });
    overlayMarks.push({
      type: "line",
      from: { data: "trend_series" },
      encode: {
        enter: {
          x: { scale: "xscale", field: "year" },
          y: { scale: "yscale", field: "food_value" },
          stroke: { value: theme.value === "night" ? "#66ffcc" : "#222" },
          strokeDash: { value: [2, 2] },
          strokeWidth: { value: 2 },
          interpolate: { value: "monotone" },
        },
      },
    });
  }

  // Prediction lines
  if (cfg.showPrediction) {
    const wantSingle =
      forceSingleCategoryPrediction && focusSeries && focusSeries.length;
    if (wantSingle) {
      let seriesForPred = focusSeries;
      if (cfg.smoothObserved && cfg.smoothWindow > 1) {
        seriesForPred = movingAverageSeries(seriesForPred, cfg.smoothWindow);
      }
      // Compute predictions
      let preds = [];
      preds = predictByMethod(
        seriesForPred,
        cfg.predictMethod,
        cfg.predictYears
      );
      // Anchor predictions to actual last observed (unsmoothed) point for continuity
      const lastActual = focusSeries[focusSeries.length - 1];
      const lastYearNum = +lastActual.year;
      let yhatLast = 0;
      yhatLast = lastFittedForMethod(seriesForPred, cfg.predictMethod);
      const delta = lastActual.food_value - yhatLast;
      const shiftedPreds = preds.map((d) => ({
        ...d,
        food_value: d.food_value + delta,
      }));
      const joined = [
        {
          year: String(lastActual.year),
          category: lastActual.category,
          food_value: lastActual.food_value,
        },
        ...shiftedPreds.map((d) => ({
          ...d,
          year: String(d.year),
          category: lastActual.category,
        })),
      ].filter((d) => Number.isFinite(d.food_value));

      augmented.data.push({ name: "prediction_series", values: joined });
      predictionDataNames.push("prediction_series");
      addedPrediction = true;
      overlayMarks.push({
        type: "line",
        from: { data: "prediction_series" },
        encode: {
          enter: {
            x: { scale: "xscale", field: "year" },
            y: { scale: "yscale", field: "food_value" },
            stroke: { scale: "color", field: "category" },
            strokeDash: { value: [6, 3] },
            strokeWidth: { value: 2 },
            opacity: { value: 0.9 },
            interpolate: {
              value: cfg.predictMethod === "linear" ? "linear" : "monotone",
            },
          },
        },
      });
    } else {
      const allPreds = [];
      byCat.forEach((series, cat) => {
        let s = series;
        if (cfg.smoothObserved && cfg.smoothWindow > 1) {
          s = movingAverageSeries(s, cfg.smoothWindow);
        }
        let preds = [];
        preds = predictByMethod(s, cfg.predictMethod, cfg.predictYears);
        // Anchor to actual last point per category
        const lastActual = series[series.length - 1];
        const lastYearNum = +lastActual.year;
        let yhatLast = 0;
        yhatLast = lastFittedForMethod(s, cfg.predictMethod);
        const delta = lastActual.food_value - yhatLast;
        const shifted = preds.map((d) => ({
          ...d,
          food_value: d.food_value + delta,
          category: cat,
        }));
        const joined = [
          {
            year: String(lastActual.year),
            category: cat,
            food_value: lastActual.food_value,
          },
          ...shifted.map((d) => ({
            ...d,
            year: String(d.year),
            category: cat,
          })),
        ].filter((d) => Number.isFinite(d.food_value));
        allPreds.push(...joined);
      });
      augmented.data.push({ name: "prediction_series_all", values: allPreds });
      predictionDataNames.push("prediction_series_all");
      addedPrediction = true;
      overlayMarks.push({
        type: "group",
        from: {
          facet: {
            name: "pred_facet",
            data: "prediction_series_all",
            groupby: "category",
          },
        },
        marks: [
          {
            type: "line",
            from: { data: "pred_facet" },
            encode: {
              enter: {
                x: { scale: "xscale", field: "year" },
                y: { scale: "yscale", field: "food_value" },
                stroke: { scale: "color", field: "category" },
                strokeDash: { value: [6, 3] },
                strokeWidth: { value: 1.8 },
                opacity: { value: 0.6 },
                interpolate: {
                  value: cfg.predictMethod === "linear" ? "linear" : "monotone",
                },
              },
            },
          },
        ],
      });
    }
  }

  // Push overlays
  augmented.marks = augmented.marks.concat(overlayMarks);

  // Extend domains if prediction exists
  if (addedPrediction) {
    const xScale = augmented.scales.find((s) => s.name === "xscale");
    const yScale = augmented.scales.find((s) => s.name === "yscale");
    if (xScale) {
      const originalDomain = xScale.domain;
      const predYearFields = predictionDataNames.map((n) => ({
        data: n,
        field: "year",
      }));
      xScale.domain = {
        fields: [originalDomain, ...predYearFields],
      };
    }
    if (yScale) {
      const originalYDomain = yScale.domain;
      const predValFields = predictionDataNames.map((n) => ({
        data: n,
        field: "food_value",
      }));
      yScale.domain = {
        fields: [originalYDomain, ...predValFields],
      };
    }
  }

  return augmented;
}

function adjustSpecForSelection(spec) {
  // 主图仅对“点击高亮”生效；如果已通过下拉选择打开详情窗，则不在主图高亮
  // if (selectedCategory.value) return spec;
  const sel = lastClickedCategory.value;
  if (!sel) return spec;
  const augmented = JSON.parse(JSON.stringify(spec));
  if (!augmented.marks || !augmented.marks[0] || !augmented.marks[0].marks)
    return spec;
  const lineMark = augmented.marks[0].marks[0];
  const pointMark = augmented.marks[0].marks[1];
  lineMark.encode = lineMark.encode || {};
  lineMark.encode.update = lineMark.encode.update || {};
  pointMark.encode = pointMark.encode || {};
  pointMark.encode.update = pointMark.encode.update || {};

  const testExpr = `datum.category === '${sel.replace(/'/g, "\\'")}'`;
  lineMark.encode.update.strokeWidth = [
    { test: testExpr, value: 4 },
    { value: 2 },
  ];
  lineMark.encode.update.opacity = [
    { test: testExpr, value: 1 },
    { value: 0.15 },
  ];
  pointMark.encode.update.size = [
    {
      test: "hovered && hovered.year === datum.year && hovered.category === datum.category",
      value: 200,
    },
    {
      test: testExpr,
      value: 140,
    },
    {
      value: 60,
    },
  ];
  return augmented;
}

function adjustSpecHighlightForCategory(spec, cat) {
  if (!cat) return spec;
  const augmented = JSON.parse(JSON.stringify(spec));
  if (!augmented.marks || !augmented.marks[0] || !augmented.marks[0].marks)
    return spec;
  const lineMark = augmented.marks[0].marks[0];
  const pointMark = augmented.marks[0].marks[1];
  lineMark.encode = lineMark.encode || {};
  lineMark.encode.update = lineMark.encode.update || {};
  pointMark.encode = pointMark.encode || {};
  pointMark.encode.update = pointMark.encode.update || {};

  const testExpr = `datum.category === '${cat.replace(/'/g, "\\'")}'`;
  lineMark.encode.update.strokeWidth = [
    { test: testExpr, value: 4 },
    { value: 2 },
  ];
  lineMark.encode.update.opacity = [
    { test: testExpr, value: 1 },
    { value: 0.12 },
  ];
  pointMark.encode.update.size = [
    { test: testExpr, value: 140 },
    { value: 40 },
  ];

  pointMark.encode.update.size = [
    {
      test: "hovered && hovered.year === datum.year && hovered.category === datum.category",
      value: 200,
    },
    {
      test: testExpr,
      value: 140,
    },
    {
      value: 60,
    },
  ];
  return augmented;
}

const canCorrelate = computed(() => !!getFocusCategoryName());

const renderChart = async (width, height) => {
  try {
    // 若容器尚未挂载，等待一帧
    if (!chartContainer.value) {
      await nextTick();
      if (!chartContainer.value) return; // 容器不存在则跳过，避免 null does not exist
    }
    console.log("Begin Rendering");
    let spec = await loadBaseSpec();
    spec.width = width;
    spec.height = height;
    if (
      spec.marks[1] &&
      spec.marks[1].encode &&
      spec.marks[1].encode.enter &&
      spec.marks[1].encode.enter.y
    ) {
      spec.marks[1].encode.enter.y.value = height;
    }

    // Theme adjustments
    if (theme.value === "night") {
      spec.background = "#121212";
      const axisColor = "#ddd";
      spec.axes.forEach((a) => {
        a.labelColor = axisColor;
        a.tickColor = axisColor;
        a.domainColor = axisColor;
        a.titleColor = axisColor;
      });
      spec.legends.forEach((l) => (l.labelColor = axisColor));
      spec.scales.find((s) => s.name === "color").range = buildColorRange(
        spec.scales.find((s) => s.name === "color").range
      );
    } else {
      spec.background = "#e0f7fa";
    }

    // Responsive x-axis label angle
    const yearAxis = spec.axes.find((axis) => axis.orient === "bottom");
    if (width < 800) {
      yearAxis.labelAngle = -90;
      yearAxis.labelAlign = "right";
      yearAxis.labelBaseline = "middle";
    } else {
      yearAxis.labelAngle = 0;
      yearAxis.labelAlign = "center";
      yearAxis.labelBaseline = "top";
    }

    // Apply click highlight only
    spec = adjustSpecForSelection(spec);

    // Add overlays (main chart: global avg, allow multi predictions when no focus)
    spec = addOverlays(spec, {
      focusCategoryName: null,
      averageMode: "global",
      forceSingleCategoryPrediction: false,
    });

    const result = await vegaEmbed.default(chartContainer.value, spec, {
      actions: false,
    });

    // Bind legend click after embed
    bindLegendClickHandlers();

    const view = result.view;

    view.addSignalListener("clicked", async (_, value) => {
      if (!value) return;
      lastClickedCategory.value = value.category;
      if (!isLinkMode.value) {
        reRenderWithOverlays();
      }
      // if (wrapperRef.value) {
      //   const { width, height } = wrapperRef.value.getBoundingClientRect();
      //   await renderChart(
      //     Math.floor(width) * 0.75,
      //     Math.floor(height - 40) * 0.7
      //   );
      // }
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
        // const fileName = `/vega_f11/${value.year}_${value.category}_vega.json`;
        // const res = await fetch(fileName);
        // if (!res.ok) {
        //   showCustomMessage("⚠️ 没有找到对应的子图数据文件");
        //   return;
        // }
        // const spec = await res.json();
        const res = await getWorldChartData(value.year, value.category);
        const spec = res.data;

        const response = await emit("update:clickedChart", {
          ...spec,
          year: value.year,
          category: value.category,
        });
      }
    });

    view.addSignalListener("clickedYear", async (_, value) => {
      if (!value) return;

      if (isLinkMode.value) {
        const specBase = await loadBaseSpec();
        const yearData = specBase.data[0].values.filter(
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
        // const path =
        //   chartMode.value === "pie"
        //     ? `/vega_charts_2/vega_pie_${value.year}.json`
        //     : `/vega3/${value.year}_WORLD.json`;
        // const res = await fetch(path);
        // if (!res.ok) {
        //   showCustomMessage("⚠️ 未找到年份图数据文件");
        //   return;
        // }
        // const specChild = await res.json();
        var specChild;
        if (chartMode.value === "pie") {
          const res = await getPieChartData(value.year);
          console.log(res);
          specChild = res.data;
          console.log(specChild);
        } else {
          const res = await getTreemapChartData(value.year);
          console.log(res);
          specChild = res.data;
          console.log(specChild);
        }
        if (chartMode.value === "pie") {
          emit("update:clickedYearChart_pie", {
            ...specChild,
            year: value.year,
            category: value.category,
          });
        } else {
          emit("update:clickedYearChart_treemap", {
            ...specChild,
            year: value.year,
            category: value.category,
          });
        }
      }
    });
  } catch (e) {
    console.error("❌ Vega 主图渲染失败", e);
    showCustomMessage("主图渲染失败，请查看控制台错误详情");
  }
};

async function renderDetail() {
  if (!detailVisible.value || !selectedCategory.value) return;
  try {
    // 确保容器存在
    await nextTick();
    if (!detailContainer.value) return;
    let spec = await loadBaseSpec();
    // 等待 DOM 更新后测量容器尺寸
    await nextTick();
    const rect = detailContainer.value?.getBoundingClientRect?.() || {
      width: 860,
      height: 520,
    };
    const availW = Math.max(480, Math.floor(rect.width));
    const availH = Math.max(360, Math.floor(rect.height));
    // 自适应小窗容器
    spec.autosize = { type: "fit", contains: "padding" };
    spec.width = availW;
    spec.height = availH;

    // 主题适配
    if (theme.value === "night") {
      spec.background = "#1a1a1a";
      const axisColor = "#ddd";
      spec.axes.forEach((a) => {
        a.labelColor = axisColor;
        a.tickColor = axisColor;
        a.domainColor = axisColor;
        a.titleColor = axisColor;
      });
      spec.legends.forEach((l) => (l.labelColor = axisColor));
      spec.scales.find((s) => s.name === "color").range = buildColorRange(
        spec.scales.find((s) => s.name === "color").range
      );
    } else {
      spec.background = "#ffffff";
    }

    // 固定标签角度
    const yearAxis = spec.axes.find((axis) => axis.orient === "bottom");
    yearAxis.labelAngle = 0;
    yearAxis.labelAlign = "center";
    yearAxis.labelBaseline = "top";

    // 高亮选中类别
    spec = adjustSpecHighlightForCategory(spec, selectedCategory.value);

    // 添加覆盖层：类别均值 + 单类别预测/趋势（独立于主图配置）
    const overlayConf = {
      showAverage: dShowAverage.value,
      showTrend: dShowTrend.value,
      showPrediction: dShowPrediction.value,
      smoothWindow: dSmoothWindow.value,
      predictYears: dPredictYears.value,
      predictMethod: dPredictMethod.value,
      smoothObserved: dSmoothObserved.value,
    };
    spec = addOverlays(
      spec,
      {
        focusCategoryName: selectedCategory.value,
        averageMode: "category",
        forceSingleCategoryPrediction: true,
      },
      overlayConf
    );

    // 若存在第二个 mark (xAxisPoints)，同步其 y 与高度
    if (
      spec.marks[1] &&
      spec.marks[1].encode &&
      spec.marks[1].encode.enter &&
      spec.marks[1].encode.enter.y
    ) {
      spec.marks[1].encode.enter.y.value = spec.height;
    }

    await vegaEmbed.default(detailContainer.value, spec, { actions: false });
  } catch (e) {
    console.error("❌ 详情窗渲染失败", e);
    showCustomMessage("详情窗渲染失败，请查看控制台错误详情");
  }
}

function reRenderWithOverlays() {
  // 重绘主图
  if (wrapperRef.value) {
    const { width, height } = wrapperRef.value.getBoundingClientRect();
    renderChart(Math.floor(width) * 0.75, Math.floor(height - 40) * 0.7);
  }
  // 若详情窗打开，同时重绘详情
  if (detailVisible.value) {
    reRenderDetail();
  }
}

function reRenderDetail() {
  // 直接重新渲染详情
  renderDetail();
}

function bindLegendClickHandlers() {
  const root = chartContainer.value;
  if (!root) return;
  const entries = root.querySelectorAll(
    ".role-legend-entry, .role-legend .role-legend-entry"
  );
  entries.forEach((entry) => {
    const el = entry;
    if (el.dataset && el.dataset.legendBound === "1") return;
    const labelEl = entry.querySelector(".role-legend-label");
    const text =
      labelEl && labelEl.textContent ? labelEl.textContent.trim() : "";
    if (!text) return;
    el.style.cursor = "pointer";
    if (el.dataset) el.dataset.legendBound = "1";
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      selectedCategory.value = text;
      onSelectCategory();
    });
  });
}

onMounted(() => {
  const resize = () => {
    if (!wrapperRef.value) return;
    const { width, height } = wrapperRef.value.getBoundingClientRect();
    renderChart(Math.floor(width) * 0.75, Math.floor(height - 40) * 0.7);
    if (detailVisible.value) renderDetail();
    if (correlationVisible.value) renderCorrelationModal();
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

.main-chart.night {
  background: #121212;
  color: #eee;
}
.main-chart.night .title {
  color: #fff;
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
.chart-mode-btn,
.theme-btn {
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
.chart-mode-btn:hover,
.theme-btn:hover {
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
.theme-btn {
  top: 70px;
  right: 30px;
}

/* 统一风格的 category-selector */
.category-selector {
  position: absolute;
  top: 680px;
  right: 30px;
  display: flex;
  gap: 12px;
  align-items: center;
  background: linear-gradient(to right, #a1c4fd, #c2e9fb);
  padding: 10px 16px;
  border-radius: 30px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  border: none;
}

.category-selector label {
  font-size: 14px;
  font-weight: bold;
  color: rgb(53, 45, 45);
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-selector select {
  padding: 6px 12px;
  border-radius: 20px;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-weight: bold;
  color: rgb(53, 45, 45);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.category-selector select:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.category-selector button {
  padding: 6px 12px;
  border: none;
  background: linear-gradient(to right, #4facfe, #00f2fe);
  color: white;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.category-selector button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.25);
  background: linear-gradient(to right, #3fa1fe, #00e2fe);
}

/* 统一风格的 overlay-controls */
.overlay-controls {
  position: absolute;
  top: 10px;
  left: 200px;
  background: linear-gradient(to right, #a1c4fd, #c2e9fb);
  padding: 12px 16px;
  border-radius: 30px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  border: none;
}

.overlay-controls label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  color: rgb(53, 45, 45);
  cursor: pointer;
  transition: all 0.3s ease;
}

.overlay-controls label:hover {
  transform: translateY(-1px);
}

.overlay-controls input[type="checkbox"] {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 2px solid rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.overlay-controls input[type="checkbox"]:checked {
  background: linear-gradient(to right, #4facfe, #00f2fe);
  border-color: rgba(255, 255, 255, 0.9);
}

.overlay-controls input[type="checkbox"]:checked::before {
  content: "✓";
  color: white;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}

.prediction-controls {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 2px solid rgba(255, 255, 255, 0.5);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.prediction-controls label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  font-weight: bold;
}

.prediction-controls input[type="range"] {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.9);
  outline: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.prediction-controls input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(to right, #4facfe, #00f2fe);
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  border: 2px solid white;
}

.prediction-controls select {
  padding: 6px 10px;
  border-radius: 20px;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  font-weight: bold;
  color: rgb(53, 45, 45);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.prediction-controls select:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.insight-controls {
  position: absolute;
  top: 120px;
  right: 30px;
  display: flex;
  gap: 10px;
}
.insight-controls button {
  font-size: 13px;
  background: linear-gradient(to right, #4facfe, #00f2fe);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  border: none;
  cursor: pointer;
}
.insight-controls button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 详情浮窗 */
.detail-modal {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: min(96vw, 1100px);
  height: min(92vh, 760px);
  background: #ffffff;
  border: 1px solid #ddd;
  border-radius: 12px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.25);
  padding: 12px 14px 14px 14px;
  display: flex;
  flex-direction: column;
  z-index: 2000;
  overflow: auto;
}
.detail-modal.night {
  background: #1e1e1e;
  color: #eee;
  border-color: #333;
}
.detail-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.detail-header .spacer {
  flex: 1;
}
.detail-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  font-size: 12px;
  margin-bottom: 8px;
}
.detail-controls label {
  display: flex;
  align-items: center;
  gap: 4px;
}
.detail-prediction-controls {
  display: flex;
  gap: 10px;
  align-items: center;
}
.detail-prediction-controls input {
  width: 120px;
}
.detail-body {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.detail-vega {
  flex: 0 0 auto;
  height: clamp(320px, 48vh, 520px);
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px 14px;
  margin-top: 8px;
}
.stat {
  background: #f7fbff;
  border: 1px solid #e6eef6;
  border-radius: 10px;
  padding: 10px 12px;
}
.night .stat {
  background: #20252b;
  border-color: #2c3640;
}
.stat.wide {
  grid-column: span 2;
}
.stat-title {
  font-size: 12px;
  color: #5b7083;
  margin-bottom: 4px;
}
.night .stat-title {
  color: #9aa9b5;
}
.stat-value {
  font-size: 18px;
  font-weight: 700;
}
.muted {
  color: #8a9aa8;
  font-weight: 400;
  margin-left: 4px;
  font-size: 12px;
}
.night .muted {
  color: #a0aebc;
}
.sub-row {
  font-size: 13px;
  line-height: 1.5;
  margin-top: 2px;
}
.chips {
  display: flex;
  gap: 6px;
  margin: 2px 0 4px 0;
}
.chip {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid transparent;
}
.chip.up {
  background: #e6f7ec;
  color: #177245;
  border-color: #bce3c7;
}
.chip.down {
  background: #fff1f0;
  color: #a61d24;
  border-color: #f5c6c6;
}
.night .chip.up {
  background: #173a2a;
  color: #9fd6b2;
  border-color: #2d5b44;
}
.night .chip.down {
  background: #402127;
  color: #f3a6ac;
  border-color: #70424a;
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

.correlation-modal {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: min(90vw, 880px);
  height: min(80vh, 600px);
  background: #ffffff;
  border: 1px solid #ddd;
  border-radius: 12px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  padding: 10px 12px 12px 12px;
  z-index: 2200;
}
.correlation-modal.night {
  background: #1e1e1e;
  color: #eee;
  border-color: #333;
}
.correlation-body {
  flex: 1;
  overflow: auto;
}
.correlation-vega {
  width: 100%;
  min-height: 260px;
}
</style>
