<template>
  <div>
    <h2 class="title">📊 Food Value Trends</h2>
    <div ref="chartContainer" id="vega-chart"></div>

    <!-- 图表显示框 -->
    <div ref="clickedChartDiv" class="chart-box left-bottom" v-show="clickedChartSpec"></div>
    <div ref="hoveredChartDiv" class="chart-box bottom-center" v-show="hoveredYearChartSpec"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as vegaEmbed from 'vega-embed'

const chartContainer = ref(null)

// 图表内容 spec
const clickedChartSpec = ref(null)
const hoveredYearChartSpec = ref(null)

// DOM 容器引用
const clickedChartDiv = ref(null)
const hoveredChartDiv = ref(null)

const isHoveredChartVisible = ref(false)

// 渲染 hovered 年份图表
const renderHoveredChart = async () => {
  await nextTick()
  if (hoveredChartDiv.value && hoveredYearChartSpec.value) {
    console.log('📈 Rendering hovered chart...')
    const cleanSpec = JSON.parse(JSON.stringify(hoveredYearChartSpec.value))  // 深拷贝
    await vegaEmbed.default(hoveredChartDiv.value, cleanSpec, { actions: false })
  }
}

// 渲染 clicked 图表
const renderClickedChart = async () => {
  await nextTick()
  if (clickedChartDiv.value && clickedChartSpec.value) {
    console.log('📈 Rendering clicked chart...')
    const cleanSpec = JSON.parse(JSON.stringify(clickedChartSpec.value))
    await vegaEmbed.default(clickedChartDiv.value, cleanSpec, { actions: false })
  }
}

onMounted(async () => {
  const result = await vegaEmbed.default(chartContainer.value, '/vega_line.json')
  const view = result.view

  // 悬停年份信号
  view.addSignalListener('hoveredYear', async (name, value) => {
    if (value) {
      const fileName = `/vega_charts_2/vega_pie_${value.year}.json`
      console.log(`📁 Loading hovered chart from ${fileName}`)
      try {
        const response = await fetch(fileName)
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        hoveredYearChartSpec.value = await response.json()
        await renderHoveredChart()
      } catch (err) {
        console.error('❌ Hovered chart load failed:', err)
      }
    } else {
      hoveredYearChartSpec.value = null
    }
  })

  // 点击年份 + 分类信号
  view.addSignalListener('clicked', async (name, value) => {
    if (value) {
      console.log('📌 Clicked signal value:', value)
      const { year, category } = value
      const fileName = `/vega_f11/${year}_${category}_vega.json`
      console.log(`📁 Trying to load clicked chart from ${fileName}`)

      try {
        const response = await fetch(fileName)
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        clickedChartSpec.value = await response.json()
        await renderClickedChart()
      } catch (error) {
        console.error('❌ Failed to load clicked chart:', error)
      }
    } else {
      console.log('ℹ️ Clicked value is null, clearing clickedChartSpec.')
      clickedChartSpec.value = null
    }
  })

  // 取消高亮
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
  position: relative;
}

/* 通用图表框样式 */
.chart-box {
  position: absolute;
  background: #fff;
  border: 2px solid #ddd;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.4s ease;
  z-index: 10;
}

/* 左下角显示点击图 */
.left-bottom {
  bottom: 20px;
  left: 20px;
  width: 400px;
}

/* 下方居中显示 hovered 图 */
.bottom-center {
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 400px;
}
</style>
