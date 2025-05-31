<template>
  <div>
    <h2 class="title">📊 Food Value Trends</h2>
    <div ref="chartContainer" id="vega-chart"></div>

    <div class="info-panel">
      <p><strong>Hovered Point:</strong> {{ hoveredInfo || 'None' }}</p>
      <p><strong>Clicked Point:</strong> {{ clickedInfo || 'None' }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import embed from 'vega-embed'

const chartContainer = ref(null)
const hoveredInfo = ref(null)
const clickedInfo = ref(null)

onMounted(async () => {
  const result = await embed(chartContainer.value, '/vega_line.json')
  const view = result.view

  // === 监听 hovered 信号 ===
  view.addSignalListener('hovered', (name, value) => {
    hoveredInfo.value = value
      ? `Year: ${value.year}, Category: ${value.category}, Value: ${value.food_value}`
      : null
  })

  // === 监听 clicked 信号 ===
  view.addSignalListener('clicked', (name, value) => {
    clickedInfo.value = value
      ? `Year: ${value.year}, Category: ${value.category}, Value: ${value.food_value}`
      : null
  })

  // 取消点击时点击空白处
  view.addEventListener('click', (event, item) => {
    if (!item || item.mark.name !== 'points') {
      view.signal('clicked', null).runAsync()
    }
  })
})
</script>

<style scoped>
.title {
  margin-bottom: 10px;
  font-size: 20px;
  font-weight: bold;
}
#vega-chart {
  border: 1px solid #ccc;
  padding: 10px;
}
.info-panel {
  margin-top: 20px;
  background: #f8f8f8;
  padding: 12px;
  border-radius: 8px;
}
</style>
