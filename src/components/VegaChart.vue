<template>
  <div>
    <h2 class="title">📊 Food Value Trends</h2>
    <div ref="chartContainer" id="vega-chart"></div>

    <div class="info-panel">
      <p><strong>Hovered Point:</strong> {{ hoveredInfo || 'None' }}</p>
      <p><strong>Clicked Point:</strong> {{ clickedInfo || 'None' }}</p>
      <hr />
      <p><strong>Hovered X-Axis:</strong> {{ hoveredYearInfo || 'None' }}</p>
      <p><strong>Clicked X-Axis:</strong> {{ clickedYearInfo || 'None' }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import embed from 'vega-embed'

const chartContainer = ref(null)
const hoveredInfo = ref(null)
const clickedInfo = ref(null)
const hoveredYearInfo = ref(null)
const clickedYearInfo = ref(null)

onMounted(async () => {
  const result = await embed(chartContainer.value, '/vega_line.json')
  const view = result.view

  // === 折线图上的点 ===
  view.addSignalListener('hovered', (name, value) => {
    hoveredInfo.value = value
      ? `Year: ${value.year}, Category: ${value.category}, Value: ${value.food_value}`
      : null
  })

  view.addSignalListener('clicked', (name, value) => {
    clickedInfo.value = value
      ? `Year: ${value.year}, Category: ${value.category}, Value: ${value.food_value}`
      : null
  })

  // === 横轴上的点 ===
  view.addSignalListener('hoveredYear', (name, value) => {
    hoveredYearInfo.value = value
      ? `Year: ${value.year}`
      : null
  })

  view.addSignalListener('clickedYear', (name, value) => {
    clickedYearInfo.value = value
      ? `Year: ${value.year}`
      : null
  })

  // === 取消点击线点高亮 ===
  view.addEventListener('click', (event, item) => {
    if (!item || (item.mark.name !== 'points' && item.mark.name !== 'xAxisPoints')) {
      view.signal('clicked', null).runAsync()
      view.signal('clickedYear', null).runAsync()
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
