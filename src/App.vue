<template>
  <div class="app-layout">
    <!-- 主组件区域 -->
    <div :class="mainClass">
      <LineChart
        @update:clickedChart="handleUpdate('clicked', $event)"
        @update:hoveredChart="handleUpdate('hovered', $event)"
        @update:clickedYearChart="handleUpdate('clickedYear', $event)"
      />
    </div>

    <!-- 动态组件区域 -->
    <template v-if="visibleComponents.length === 1">
      <div class="half-screen right">
        <component
          :is="visibleComponents[0].comp"
          v-bind="visibleComponents[0].props"
        />
      </div>
    </template>

    <template v-else-if="visibleComponents.length === 2">
      <div class="right-column">
        <component
          v-for="(vc, idx) in visibleComponents"
          :key="idx"
          :is="vc.comp"
          v-bind="vc.props"
          style="height: 50%"
        />
      </div>
    </template>

    <template v-else-if="visibleComponents.length === 3">
      <div
        v-for="(vc, idx) in visibleComponents"
        :key="idx"
        class="quarter-block"
      >
        <component :is="vc.comp" v-bind="vc.props" />
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import LineChart from "./components/LineChart.vue";
import EarthChart from "./components/EarthChart.vue";
import BarChart from "./components/BarChart.vue";
import TreemapChart from "./components/TreemapChart.vue";

const clickedChart = ref(null);
const hoveredChart = ref(null);
const clickedYearChart = ref(null);

const handleUpdate = (type, spec) => {
  if (type === "clicked") {
    clickedChart.value = spec;
    console.log("clickedChart:");
    console.log(clickedChart);
    console.log("-----------------");
  }
  if (type === "hovered") hoveredChart.value = spec;
  if (type === "clickedYear") clickedYearChart.value = spec;
};

const visibleComponents = computed(() => {
  const list = [];
  if (clickedChart.value)
    list.push({ comp: EarthChart, props: { spec: clickedChart.value } });
  if (hoveredChart.value)
    list.push({ comp: BarChart, props: { spec: hoveredChart.value } });
  if (clickedYearChart.value)
    list.push({
      comp: TreemapChart,
      props: { spec: clickedYearChart.value },
    });

  console.log("list");
  console.log(list);

  return list;
});

const mainClass = computed(() => {
  const count = visibleComponents.value.length;
  if (count === 0) return "full-screen";
  if (count === 1 || count === 2) return "half-screen left";
  return "quarter-screen";
});
</script>

<style scoped>
.app-layout {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-wrap: wrap;
  overflow: hidden;
  position: relative;
}

/* 仅组件1 */
.full-screen {
  width: 100vw;
  height: 100vh;
}

/* 左半屏样式（组件1在2/3情况） */
.half-screen {
  width: 50vw;
  height: 100vh;
}

/* quarter-block 也用于 4 分之一情况 */
.quarter-block {
  width: 50vw;
  height: 50vh;
}

.left {
  order: 0;
}

.right {
  order: 1;
}

/* 两个动态组件时，右边竖排布局 */
.right-column {
  width: 50vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.quarter-screen {
  width: 50vw;
  height: 50vh;
}
</style>
