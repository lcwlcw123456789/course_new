<template>
  <div class="app-layout">
    <!-- 主图区域 -->
    <div :class="mainClass">
      <LineChart
        :container-count="componentStack.length"
        @update:clickedChart="addComponent('clicked', $event)"
        @update:hoveredChart="addComponent('hovered', $event)"
        @update:clickedYearChart="addComponent('clickedYear', $event)"
      />
    </div>

    <!-- 右侧子图区域 -->
    <div v-if="componentStack.length > 0" class="right-grid">
      <VueDraggable v-model="componentStack">
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

// 所有子组件的堆叠数组
const componentStack = ref([]);

// 被锁定的组件 key 集合
const lockedKeys = ref(new Set());

// 类型映射到组件
function getComponent(type) {
  if (type === "clicked") return EarthChart;
  if (type === "hovered") return PieChart;
  if (type === "clickedYear") return TreemapChart;
  return null;
}

// 添加新组件
function addComponent(type, spec) {
  const key = `${type}_${Date.now()}_${Math.random()}`;
  const comp = getComponent(type);
  const props = { spec };

  componentStack.value.push({ key, comp, props });
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
  overflow-y: auto;
  order: 1;
}

.component-wrapper {
  border: 1px solid #ddd;
  box-sizing: border-box;
  padding: 4px;
  position: relative;
}
</style>
