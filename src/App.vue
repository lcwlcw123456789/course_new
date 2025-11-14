<template>
  <div class="app-layout">
    <!-- 主图区域 -->
    <div :class="mainClass">
      <LineChart
        :container-count="componentStack.length"
        @update:clickedChart="addComponent('clicked', $event)"
        @update:clickedYearChart_pie="addComponent('clickedYear_pie', $event)"
        @update:clickedYearChart_treemap="
          addComponent('clickedYear_treemap', $event)
        "
        @update:recommendations="addComponent('insights', $event)"
        @update:correlations="addComponent('correlations', $event)"
      />
    </div>

    <!-- 右侧子图区域 -->
    <div v-if="componentStack.length > 0" class="right-grid">
      <VueDraggable
        v-model="componentStack"
        class="right-grid swapHighlight"
        :filter="'.no-drag'"
        :prevent-on-filter="false"
        :sort="true"
        :animation="300"
        :scroll="true"
        :scrollSensitivity="200"
        :scrollSpeed="1"
      >
        <div
          v-for="(vc, idx) in componentStack"
          :key="vc.key"
          class="component-wrapper"
        >
          <component
            :is="vc.comp"
            v-bind="vc.props"
            :container-count="componentStack.length"
            @close="removeComponent(vc.key)"
          />
        </div>
      </VueDraggable>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { VueDraggable } from "vue-draggable-plus";
import LineChart from "./components/LineChart.vue";
import EarthChart from "./components/EarthChart.vue";
import PieChart from "./components/PieChart.vue";
import TreemapChart from "./components/TreemapChart.vue";
import InsightsPanel from "./components/InsightsPanel.vue";

// 所有子组件的堆叠数组
const componentStack = ref([]);

// 被锁定的组件 key 集合
const lockedKeys = ref(new Set());

// 类型映射到组件
function getComponent(type) {
  if (type === "clicked") return EarthChart;
  if (type === "clickedYear_pie") return PieChart;
  if (type === "clickedYear_treemap") return TreemapChart;
  if (type === "insights") return InsightsPanel;
  if (type === "correlations") return InsightsPanel;
  return null;
}

// 添加新组件
function addComponent(type, payload) {
  const key = `${type}_${Date.now()}_${Math.random()}`;
  const comp = getComponent(type);

  // 默认 props
  let props = {};

  if (type === "clicked" || type === "clickedYear_pie" || type === "clickedYear_treemap") {
    const { year, category } = payload;
    props = {
      spec: payload,
      meta: { year, category },
    };
  } else if (type === "insights") {
    // payload: { title, mode: 'recommendations', data }
    props = payload;
  } else if (type === "correlations") {
    // payload: { title, mode: 'correlations', data, category }
    props = payload;
  }

  if (comp) componentStack.value.push({ key, comp, props });
}

// 关闭组件
function removeComponent(key) {
  lockedKeys.value.delete(key);
  componentStack.value = componentStack.value.filter((c) => c.key !== key);
}

// 锁定组件（可扩展用）
function lockComponent(key) {
  lockedKeys.value.add(key);
}

// 主图样式控制
const mainClass = computed(() => {
  return componentStack.value.length > 0 ? "half-screen left" : "full-screen";
});
</script>

<style scoped>
.app-layout {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-wrap: nowrap;
  overflow: hidden;
}

.full-screen {
  width: 100vw;
  height: 100vh;
}

.half-screen {
  width: 50vw;
  height: 100vh;
}

.left {
  order: 0;
}

.right-grid {
  width: 50vw;
  height: 100vh;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(50%, 1fr));
  grid-auto-rows: 50vh;
  position: relative;
  overflow-y: auto;
  order: 1;
}

.swapHighlight {
  background-color: aliceblue !important;
  border: 1px solid #000000;
}

.component-wrapper {
  border: 1px solid #ddd;
  box-sizing: border-box;
  padding: 1px;
  position: relative;
}
</style>
